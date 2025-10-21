# loglady 🪵

loglady is an opinionated TypeScript logger developed for and by [vestfoldfylke](https://github.com/vestfoldfylke)

> [!IMPORTANT]
> Node.js >= 18 is required to use loglady.

## Log destinations

loglady supports the following log destinations out of the box:

- BetterStack
- Console

The following log destinations are planned before v1.0.0:

- File
- Microsoft Teams

### BetterStack destination

To use the BetterStack log destination, you need to set the following environment variables:
- `BETTERSTACK_URL`: Your BetterStack Endpoint URL
- `BETTERSTACK_TOKEN`: The BetterStack token for authentication

### Console destination

The Console log destination is enabled by default. You can disable it by setting the following environment variable:
- `CONSOLE_ENABLED`: Set to `false` to disable console logging

### Add your own log destination

loglady is built with extensibility in mind. A new log destination can be created by implementing the `LogDestination` interface.

1. Create a new folder under `src/destinations/` for the new destination. Name the folder according to the destination name (e.g. `Console`).
2. Create a new class that implements the `LogDestination` interface. Name the class according to the destination name (e.g. `ConsoleDestination`).
3. Remember to export your class as default, otherwise loglady won't be able to instantiate it.
4. Implement the required properties and method(s).

> [!CAUTION]
> Make sure that your `log` function sets the `isSettled` property to `true` when the promise is settled.<br />
> <b><u>If `isSettled` is not set to `true`, the logger's flush function will hang indefinitely!</u></b>

## Usage

```typescript
import { logger } from '@vestfoldfylke/loglady';

// log at different levels. All log functions support message templates and parameters
logger.debug('This is a debug message');
logger.info('This is an info message for UserName {UserName}', 'john.doe');
logger.warn('This is a warning message');

// error, fatal and critical log functions also support logging exceptions
logger.error('This is an error message without an exception with ErrorMessage: {ErrorMessage}', error.message);
logger.error(error, 'This is an error message with an exception but without additional parameters');
logger.error(error, 'This is an error message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

logger.fatal('This is a fatal message without an exception with ErrorMessage: {ErrorMessage}', error.message);
logger.fatal(error, 'This is a fatal message with an exception but without additional parameters');
logger.fatal(error, 'This is a fatal message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

logger.critical('This is a critical message without an exception with ErrorMessage: {ErrorMessage}', error.message);
logger.critical(error, 'This is a critical message with an exception but without additional parameters');
logger.critical(error, 'This is a critical message with an exception with additional parameters: ErrorMessage: {ErrorMessage}', error.message);

// flush any log messages not completed yet (if applicable)
await logger.flush();
```