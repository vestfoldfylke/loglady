import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, TrackedPromise } from '../../types/log.types';
import type { MicrosoftTeamsColor } from '../../types/microsoft-teams-color';

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 * 
 * LogDestination that logs to Microsoft Teams<br /><br />
 * 
 * **active**: `true` only when **TEAMS_WEBHOOK_URL** is specified as an environment variable<br />
 * **name**: 'Microsoft Teams'
 */
export default class MicrosoftTeamsDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = 'Microsoft Teams';

  // @ts-ignore - This comment can be removed when _pkg is used
  private readonly _pkg: unknown;
  private readonly _webhookUrl: string | undefined;

  constructor(pkg: unknown) {
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
      case 'CRITICAL':
      case 'FATAL':
        return 'attention';
      default:
        return 'default';
    }
  }

  private getRepositoryString(): string | undefined {
    if (!this._pkg || typeof this._pkg !== 'object' || !('repository' in this._pkg)) {
      return undefined;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repository = (this._pkg as any).repository;

    if (typeof repository === 'string') {
      return repository.replace('git+', '').replace('.git', '');
    }

    if (typeof repository === 'object' && 'url' in repository) {
      return repository.url.replace('git+', '').replace('.git', '');
    }

    return undefined;
  }
  
  private getAdaptiveCardTitle(level: LogLevel): string {
    if (!this._pkg || typeof this._pkg !== 'object' || !('name' in this._pkg) || !('version' in this._pkg)) {
      return `${level} - loglady 🪵`;
    }

    const appName = 'name' in this._pkg
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (this._pkg as any).name
      : undefined;
    const version = 'version' in this._pkg
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (this._pkg as any).version
      : undefined;

    return `${level} - ${appName} - v${version}`;
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
        codeSnippet: messageObject.exception
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
    const color: MicrosoftTeamsColor = this.getAdaptiveCardColor(level);
    const repositoryString: string | undefined = this.getRepositoryString();
    const title: string | undefined = this.getAdaptiveCardTitle(level);

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