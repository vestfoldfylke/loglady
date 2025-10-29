import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, MessageObjectProperties, MessageParameter, TrackedPromise } from '../../types/log.types';
import type { MicrosoftTeamsColor, MicrosoftTeamsLink } from '../../types/destinations/microsoft-teams.types';
import type { MinimalPackage } from '../../types/minimal-package.types';

import { canLogAtLevel } from '../../lib/log-level.js';

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 * 
 * LogDestination that logs to Microsoft Teams<br /><br />
 * 
 * **active**: `true` only when **TEAMS_WEBHOOK_URL** is specified as an environment variable<br />
 * **name**: 'Microsoft Teams'<br /><br >
 * 
 * Minimum log level defaults to `ERROR` but can be customized by specifying the **TEAMS_MIN_LOG_LEVEL** environment variable
 */
export default class MicrosoftTeamsDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = 'Microsoft Teams';

  private readonly _links: MicrosoftTeamsLink[];
  private readonly _minLogLevel: LogLevel;
  // @ts-ignore - This comment can be removed when _pkg is used
  private readonly _pkg: MinimalPackage;
  private readonly _webhookUrl: string | undefined;

  constructor(pkg: MinimalPackage) {
    this._minLogLevel = (process.env['TEAMS_MIN_LOG_LEVEL'] as LogLevel) || 'ERROR';
    this._pkg = pkg;
    this._webhookUrl = process.env['TEAMS_WEBHOOK_URL'];

    this.active = this._webhookUrl !== undefined;
    this._links = this.getLinks();
  }
  
  private getLinks(): MicrosoftTeamsLink[] {
    const links: MicrosoftTeamsLink[] = process.env['TEAMS_LINKS']?.split(',')
      .map(link => {
        const linkParts: string[] = link.split(';');
        if (linkParts.length !== 2 || !/^https:\/\//.test(linkParts[1] as string)) {
          return null;
        }

        return {
          title: linkParts[0] as string,
          url: linkParts[1] as string
        };
      })
      .filter((link: MicrosoftTeamsLink | null) => link !== null)
    ?? [];

    const repositoryString: string | undefined = this.getRepositoryString();
    if (repositoryString === undefined || !/^https:\/\//.test(repositoryString)) {
      return links;
    }

    const url = new URL(repositoryString);
    if (url.hostname === 'github.com') {
      links.push({
        title: 'Repository',
        url: repositoryString
      });
    }

    return links;
  }

  private getAdaptiveCardColor(level: LogLevel): MicrosoftTeamsColor {
    switch (level) {
      case 'DEBUG':
        return 'accent';
      case 'INFO':
        return 'good';
      case 'WARN':
        return 'warning';
      case 'ERROR':
        return 'attention';
      default:
        return 'default';
    }
  }

  private getRepositoryString(): string | undefined {
    if (!this._pkg.repository) {
      return undefined;
    }

    const repository = this._pkg.repository;

    if (typeof repository === 'string') {
      return repository.replace('git+', '').replace('.git', '');
    }

    if (typeof repository === 'object' && 'url' in repository) {
      return repository.url.replace('git+', '').replace('.git', '');
    }

    return undefined;
  }
  
  private getAdaptiveCardTitle(level: LogLevel, properties: MessageObjectProperties): string {
    const appName: string | undefined = properties['AppName'] as string ?? undefined;
    const version: string | undefined = properties['Version'] as string ?? undefined;

    if (appName && version) {
      return `${level} - ${appName} - v${version}`;
    }

    return `${level} - loglady 🪵`;
  }

  private getFactSetValue = (value: MessageParameter): string => {
    if (typeof value === 'object' || Array.isArray(value)) {
      return JSON.stringify(value);
    }

    return value.toString();
  };

  private createAdaptiveCardMessage(title: string, color: string, messageObject: MessageObject): unknown {
    const adaptiveCard = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            type: 'AdaptiveCard',
            speak: `${title} - ${messageObject.message}`,
            '$schema': 'https://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.5',
            msteams: {
              width: 'Full'
            },
            body: [
              {
                type: 'TextBlock',
                size: 'Large',
                weight: 'Bolder',
                text: title,
                color
              },
              {
                type: 'TextBlock',
                text: messageObject.message,
                wrap: true
              },
              {
                type: 'FactSet',
                spacing: 'Small',
                separator: true,
                facts: Object.entries(messageObject.properties).map(([key, value]: [string, MessageParameter]) => {
                  return {
                    title: `${key}:`,
                    value: this.getFactSetValue(value)
                  };
                })
              }
              // exception header will be added here (if exception present)
              // exception will be added here (if exception present)
              // links will be added here (if any)
            ]
          }
        }
      ]
    };

    if (messageObject.exception !== undefined) {
      // @ts-ignore
      adaptiveCard.attachments[0]!.content.body.push({
        type: 'TextBlock',
        text: 'Exception',
        wrap: true,
        separator: true,
        maxLines: 1,
        fontType: 'Monospace',
        size: 'Large',
        weight: 'Bolder',
        color: 'Default'
      });

      // @ts-ignore
      adaptiveCard.attachments[0]!.content.body.push({
        type: 'TextBlock',
        text: messageObject.exception,
        wrap: true,
        spacing: 'None',
        fontType: 'Monospace',
        size: 'Small'
      });
    }

    if (this._links.length === 0) {
      return adaptiveCard;
    }

    adaptiveCard.attachments[0]!.content.body.push({
      type: 'ActionSet',
      separator: true,
      // @ts-ignore
      actions: this._links.map((link: MicrosoftTeamsLink) => {
        return {
          type: 'Action.OpenUrl',
          title: link.title,
          url: link.url
        };
      })
    });

    return adaptiveCard;
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    if (!canLogAtLevel(level, this._minLogLevel)) {
      return {
        name: this.name,
        promise: Promise.resolve(),
        isSettled: true
      };
    }

    const color: MicrosoftTeamsColor = this.getAdaptiveCardColor(level);
    const title: string | undefined = this.getAdaptiveCardTitle(level, messageObject.properties);

    const adaptiveCardMessage = this.createAdaptiveCardMessage(title, color, messageObject);

    const promise: Promise<Response> = fetch(this._webhookUrl as string, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adaptiveCardMessage)
    });

    const trackedPromise: TrackedPromise = {
      name: this.name,
      promise,
      isSettled: false
    };

    promise.finally((): void => {
      trackedPromise.isSettled = true;
    });

    return trackedPromise;
  }
}