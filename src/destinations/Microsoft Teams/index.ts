import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, MessageObjectProperties, TrackedPromise } from '../../types/log.types';
import type { MicrosoftTeamsColor } from '../../types/microsoft-teams-color';
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

  private readonly _minLogLevel: LogLevel;
  // @ts-ignore - This comment can be removed when _pkg is used
  private readonly _pkg: MinimalPackage;
  private readonly _webhookUrl: string | undefined;

  constructor(pkg: MinimalPackage) {
    this._minLogLevel = (process.env['TEAMS_MIN_LOG_LEVEL'] as LogLevel) || 'ERROR';
    this._pkg = pkg;
    this._webhookUrl = process.env['TEAMS_WEBHOOK_URL'];

    this.active = this._webhookUrl !== undefined;
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

  private createAdaptiveCardMessage(title: string, color: string, repositoryString: string | undefined, messageObject: MessageObject): unknown {
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
                facts: [] // add properties in here (if any)
              }
              // add exception header and message here (if any)
              // add repository underneath here (if any)
            ]
          }
        }
      ]
    };

    Object.entries(messageObject.properties).forEach(([key, value]) => {
      // @ts-ignore
      adaptiveCard.attachments[0]!.content.body[2]!.facts!.push({
        title: `${key}:`,
        value
      });
    });
    
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

    if (repositoryString === undefined) {
      return adaptiveCard;
    }

    if (/^https:\/\//.test(repositoryString)) {
      adaptiveCard.attachments[0]!.content.body.push({
        type: 'ActionSet',
        separator: true,
        // @ts-ignore
        actions: [
          {
            type: 'Action.OpenUrl',
            title: 'Repository',
            url: repositoryString
          }
        ]
      });

      return adaptiveCard;
    }

    // @ts-ignore
    adaptiveCard.attachments[0]!.content.body.push({
      type: 'TextBlock',
      separator: true,
      text: `Repository: ${repositoryString}`,
      wrap: true
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
    const repositoryString: string | undefined = this.getRepositoryString();
    const title: string | undefined = this.getAdaptiveCardTitle(level, messageObject.properties);

    const adaptiveCardMessage = this.createAdaptiveCardMessage(title, color, repositoryString, messageObject);

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