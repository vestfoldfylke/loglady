# loglady 🪵

loglady 🪵 is an opinionated, 0 dependency, TypeScript logger developed for and by [vestfoldfylke](https://github.com/vestfoldfylke)

> [!IMPORTANT]
> Node.js >= 18 is required to use loglady.

## Log destinations

loglady 🪵 supports the following log destinations:

- BetterStack
- Console
- Microsoft Teams

The following log levels are supported and can be set as the minimum log level for each destination that supports an environment variable for this:
- DEBUG
- INFO
- WARN
- ERROR

### BetterStack destination

To use the BetterStack log destination, you need to set the following environment variables:
- `BETTERSTACK_URL`: Your BetterStack endpoint URL
- `BETTERSTACK_TOKEN`: The BetterStack token for authentication
- `BETTERSTACK_MIN_LOG_LEVEL`: The minimum log level to send to BetterStack (see log levels above)

### Console destination

The Console log destination is enabled by default. You can disable it by setting the following environment variable:
- `CONSOLE_ENABLED`: Set to `false` to disable console logging
- `CONSOLE_MIN_LOG_LEVEL`: The minimum log level to log to console (see log levels above)

### Microsoft Teams destination

To use the Microsoft Teams log destination, you need to set the following environment variables:
- `TEAMS_WEBHOOK_URL`: Your Microsoft Teams webhook URL
- `TEAMS_MIN_LOG_LEVEL`: The minimum log level to send to Microsoft Teams (see log levels above)

Optional environment variables:
- `TEAMS_LINKS`: Comma separated, semicolon separated list of name and url to show as ActionButtons (open url) on the teams card.
See example further down under [Usage](#usage) 

### Add your own log destination

loglady 🪵 is built with extensibility in mind. A new log destination can be created by implementing the `LogDestination` interface.

1. Create a new folder under `src/destinations/` for the new destination. Name the folder according to the destination name (e.g. `Console`).
2. Create a new class that implements the `LogDestination` interface. Name the class according to the destination name (e.g. `ConsoleDestination`).
3. Remember to export your class as default, otherwise loglady 🪵 won't be able to instantiate it.
4. Implement the required properties and method(s).
5. Import the new destination class in `src/index.ts` and add it to the `destinations` array in the `Logger` class constructor.

> [!CAUTION]
> If your `log` function calls something asynchronously, make sure that your `log` function sets the `isSettled` property on the **TrackedPromise** to `true` when the promise is settled.<br />
> <b><u>If `isSettled` is never set to `true`, the logger's flush function will hang indefinitely!</u></b>

### MessageObject

The `MessageObject` is the object that is sent to each log destination. It contains the following properties:
- `messageTemplate`: The message template
- `message`: The formatted message (with parameters applied if any)
- `properties`: An object containing additional properties (e.g. runtime information, parameters and calling information)
- `exception`: An optional exception object (if passed to the errorException log function)

### Runtime information

loglady 🪵 automatically adds the following runtime information to each log message:
- `AppName`: The name of the application - from environment variable **APP_NAME** or `package.json` **name** field
- `Version`: The version of the application - from `package.json` **version** field
- `EnvironmentName`: The environment used - from environment variable **NODE_ENV** or defaults to `production`

### Calling information

loglady 🪵 automatically adds the following calling information to each log message:
- `FunctionName`: The name of the function that called the log function
- `FileName`: The name of the file that called the log function
- `FilePath`: The full path of the file that called the log function
- `LineNumber`: The line number in the file that called the log function
- `ColumnNumber`: The column number in the file that called the log function

## Usage

```json
{
  "BETTERSTACK_URL": "https://your-betterstack-endpoint-url",
  "BETTERSTACK_TOKEN": "your-betterstack-token",
  "BETTERSTACK_MIN_LOG_LEVEL": "WARN",
  "CONSOLE_ENABLED": "true",
  "CONSOLE_MIN_LOG_LEVEL": "DEBUG",
  "TEAMS_WEBHOOK_URL": "https://your-teams-webhook-url",
  "TEAMS_MIN_LOG_LEVEL": "ERROR",
  "TEAMS_LINKS": "LogSystem;https://somelogprovider.com/whatever,Coffee;https://letmegooglethat.com/?q=coffee",
  "APP_NAME": "loglady 🪵",
  "NODE_ENV": "production"
}
```

```typescript
import { logger } from '@vestfoldfylke/loglady';

// optionl settings to set before using the logger
logger.logConfig({
  contextId: 'some-unique-id-for-this-run', // set a context id to correlate log messages for a specific run (will be added as a property to each log message)
  prefix: 'something-to-show-before-every-message', // will be prepended to the beginning of each log message
  suffix: 'something-to-show-after-every-message', // will be appended to the end of each log message
});

// log at different levels. All log functions support message templates and parameters
logger.debug('This is a debug message');
logger.info('This is an info message for UserName {UserName}', 'john.doe');
logger.warn('This is a warning message');
logger.error('This is an error message without an exception with ErrorMessage: {ErrorMessage}', error.message);

// errorException log function supports logging an exception as well
logger.errorException(error, 'This is an error message with an exception but without additional parameters');
logger.errorException(error, 'This is an error message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

// flush any log messages not completed yet (applicable if asynchronous log destinations are used). If not called, the application may exit before all log messages are sent.
await logger.flush();
```