enum Level {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  LOG = 'log'
}

export class Logger {
  static error = (message: string) => Logger.write(message, Level.ERROR)
  static warn = (message: string) => Logger.write(message, Level.WARN)
  static info = (message: string) => Logger.write(message, Level.INFO)
  static log = (message: string) => Logger.write(message, Level.LOG)

  private static write = (message: string, level: Level): void => {
    // eslint-disable-next-line no-console
    return console[level](message)
  }
}
