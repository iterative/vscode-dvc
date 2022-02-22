import { window } from 'vscode'
import { Response } from './response'

enum Level {
  INFORMATION = 'Information',
  ERROR = 'Error',
  WARNING = 'Warning'
}

export class Toast {
  static async showOutput(stdout: Promise<string | undefined>) {
    const output = (await stdout) || 'Operation successful.'
    Toast.info(output)
  }

  static showError(message: string) {
    Toast.error(message)
    return Promise.resolve(undefined)
  }

  static askShowOrCloseOrNever(message: string): Thenable<string | undefined> {
    return Toast.info(message, Response.SHOW, Response.CLOSE, Response.NEVER)
  }

  static error(message: string, ...items: Response[]) {
    return Toast.waitForResponse(Level.ERROR, message, ...items)
  }

  static warn(message: string, ...items: Response[]) {
    return Toast.waitForResponse(Level.WARNING, message, ...items)
  }

  static info(message: string, ...items: Response[]) {
    return Toast.waitForResponse(Level.INFORMATION, message, ...items)
  }

  private static waitForResponse(
    level: Level,
    message: string,
    ...items: Response[]
  ): Thenable<Response | undefined> {
    return window[`show${level}Message`](message, ...items)
  }
}
