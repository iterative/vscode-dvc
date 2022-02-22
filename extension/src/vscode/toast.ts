import { window } from 'vscode'
import { Response } from './response'

enum Level {
  INFORMATION = 'Information',
  ERROR = 'Error',
  WARNING = 'Warning'
}

class Toast {
  static error(message: string, ...items: Response[]) {
    return Toast.show(Level.ERROR, message, ...items)
  }

  static warn(message: string, ...items: Response[]) {
    return Toast.show(Level.WARNING, message, ...items)
  }

  static info(message: string, ...items: Response[]) {
    return Toast.show(Level.INFORMATION, message, ...items)
  }

  private static show(
    level: Level,
    message: string,
    ...items: Response[]
  ): Thenable<Response | undefined> {
    return window[`show${level}Message`](message, ...items)
  }
}

export const warnWithOptions = (
  message: string,
  ...items: Response[]
): Thenable<Response | undefined> => Toast.warn(message, ...items)

export const errorWithOptions = (
  message: string,
  ...items: Response[]
): Thenable<Response | undefined> => Toast.error(message, ...items)

export const reportError = (message: string): Promise<undefined> => {
  Toast.error(message)
  return Promise.resolve(undefined)
}

export const askShowOrCloseOrNever = (
  message: string
): Thenable<string | undefined> =>
  Toast.info(message, Response.SHOW, Response.CLOSE, Response.NEVER)

export const reportOutput = async (
  stdout: Promise<string | undefined>
): Promise<void> => {
  const output = (await stdout) || 'Operation successful.'
  Toast.info(output)
}
