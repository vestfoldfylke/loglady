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
                type: 'ColumnSet',
                columns: [
                  {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                      {
                        type: 'TextBlock',
                        text: title,
                        color,
                        weight: 'Bolder',
                        style: 'heading'
                      },
                      {
                        type: 'ColumnSet',
                        targetWidth: 'AtLeast:Standard',
                        columns: [
                          {
                            type: 'Column',
                            width: 'auto',
                            items: [
                              {
                                type: 'TextBlock',
                                text: messageObject.message,
                                wrap: true
                              } // add properties underneath here (if any)
                            ],
                            spacing: 'None',
                            verticalContentAlignment: 'Center'
                          }
                        ]
                      } // add exception underneath here (if any)
                    ]
                  }
                ]
              } // add repository underneath here (if any)
            ]
          }
        }
      ]
    };

    Object.entries(messageObject.properties).forEach(([key, value]) => {
      adaptiveCard.attachments[0]!.content.body[0]!.columns[0]!.items[1]!.columns![0]!.items.push({
        type: 'ColumnSet',
        // @ts-ignore
        targetWidth: 'AtLeast:Standard',
        columns: [
          {
            type: 'Column',
            width: 'auto',
            items: [
              {
                type: 'TextBlock',
                text: '- ',
                wrap: true
              }
            ],
            spacing: 'None',
            verticalContentAlignment: 'Center'
          },
          {
            type: 'Column',
            width: 'auto',
            items: [
              {
                type: 'TextBlock',
                text: `${key} : ${value}`,
                wrap: true
              }
            ],
            spacing: 'None',
            verticalContentAlignment: 'Center'
          }
        ]
      });
    });
    
    if (messageObject.exception !== undefined) {
      adaptiveCard.attachments[0]!.content.body[0]!.columns[0]!.items.push({
        type: 'CodeBlock',
        // @ts-ignore
        codeSnippet: messageObject.exception,
        language: 'JavaScript'
      });
    }
    
    if (repositoryString !== undefined) {
      if (/^https:\/\//.test(repositoryString)) {
        adaptiveCard.attachments[0]!.content.body.push({
          type: 'ActionSet',
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

      adaptiveCard.attachments[0]!.content.body.push({
        type: 'TextBlock',
        // @ts-ignore
        text: `Repository: ${repositoryString}`,
        wrap: true
      });
    }

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