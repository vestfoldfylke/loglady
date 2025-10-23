# loglady 🪵

loglady 🪵 is an opinionated TypeScript logger developed for and by [vestfoldfylke](https://github.com/vestfoldfylke)

> [!IMPORTANT]
> Node.js >= 18 is required to use loglady.

## Log destinations

loglady 🪵 supports the following log destinations out of the box:

- BetterStack
- Console
- Microsoft Teams

The following log destinations are planned after v1.0.0:

- File

The following log levels are supported and can be set as the minimum log level for each destination that supports an environment variable for this:
- DEBUG
- INFO
- WARN
- ERROR
- FATAL
- CRITICAL

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

### Add your own log destination

loglady 🪵 is built with extensibility in mind. A new log destination can be created by implementing the `LogDestination` interface.

1. Create a new folder under `src/destinations/` for the new destination. Name the folder according to the destination name (e.g. `Console`).
2. Create a new class that implements the `LogDestination` interface. Name the class according to the destination name (e.g. `ConsoleDestination`).
3. Remember to export your class as default, otherwise loglady 🪵 won't be able to instantiate it.
4. Implement the required properties and method(s).

> [!CAUTION]
> Make sure that your `log` function sets the `isSettled` property to `true` when the promise is settled.<br />
> <b><u>If `isSettled` is not set to `true`, the logger's flush function will hang indefinitely!</u></b>

## Usage

```json
{
  "BETTERSTACK_URL": "https://your-betterstack-endpoint-url",
  "BETTERSTACK_TOKEN": "your-betterstack-token",
  "BETTERSTACK_MIN_LOG_LEVEL": "WARN",
  "CONSOLE_ENABLED": "true",
  "CONSOLE_MIN_LOG_LEVEL": "DEBUG",
  "TEAMS_WEBHOOK_URL": "https://your-teams-webhook-url",
  "TEAMS_MIN_LOG_LEVEL": "ERROR"
}
```

```typescript
import { logger } from '@vestfoldfylke/loglady';

// log at different levels. All log functions support message templates and parameters
logger.debug('This is a debug message');
logger.info('This is an info message for UserName {UserName}', 'john.doe');
logger.warn('This is a warning message');
logger.error('This is an error message without an exception with ErrorMessage: {ErrorMessage}', error.message);
logger.fatal('This is a fatal message without an exception with ErrorMessage: {ErrorMessage}', error.message);
logger.critical('This is a critical message without an exception with ErrorMessage: {ErrorMessage}', error.message);

// errorException, fatalException and criticalException log functions also support logging an exception
logger.errorException(error, 'This is an error message with an exception but without additional parameters');
logger.errorException(error, 'This is an error message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

logger.fatalException(error, 'This is a fatal message with an exception but without additional parameters');
logger.fatalException(error, 'This is a fatal message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

logger.criticalException(error, 'This is a critical message with an exception but without additional parameters');
logger.criticalException(error, 'This is a critical message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

// flush any log messages not completed yet (if applicable)
await logger.flush();
```