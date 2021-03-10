enum Level {
  error = 'error',
  warn = 'warn',
  info = 'info',
  log = 'log'
}

export class Logger {
  static error = (message: string) => Logger.write(message, Level.error)
  static warn = (message: string) => Logger.write(message, Level.warn)
  static info = (message: string) => Logger.write(message, Level.info)
  static log = (message: string) => Logger.write(message, Level.log)

  private static write = (message: string, level: Level): void => {
    // eslint-disable-next-line no-console
    return console[level](message)
  }
}
