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
    Toast.infoWithOptions(output)
  }

  static showError(message: string) {
    Toast.errorWithOptions(message)
    return Promise.resolve(undefined)
  }

  static askShowOrCloseOrNever(message: string) {
    return Toast.infoWithOptions(
      message,
      Response.SHOW,
      Response.CLOSE,
      Response.NEVER
    )
  }

  static errorWithOptions(message: string, ...items: Response[]) {
    return Toast.waitForResponse(Level.ERROR, message, ...items)
  }

  static warnWithOptions(message: string, ...items: Response[]) {
    return Toast.waitForResponse(Level.WARNING, message, ...items)
  }

  static infoWithOptions(message: string, ...items: Response[]) {
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
