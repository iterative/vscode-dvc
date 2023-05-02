import { CancellationToken, Progress, ProgressLocation, window } from 'vscode'
import { Response } from './response'
import { delay } from '../util/time'

enum Level {
  INFORMATION = 'Information',
  ERROR = 'Error',
  WARNING = 'Warning'
}

type ProgressCallback = (
  progress: Progress<{
    message?: string | undefined
    increment?: number | undefined
  }>,
  token: CancellationToken
) => Thenable<unknown>

export class Toast {
  static async showOutput(stdout: Promise<string | undefined>) {
    const output = (await stdout) || 'Operation successful.'
    void Toast.infoWithOptions(output)
  }

  static showError(message: string) {
    void Toast.errorWithOptions(message)
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

  static showProgress(title: string, callback: ProgressCallback) {
    return window.withProgress(
      {
        cancellable: false,
        location: ProgressLocation.Notification,
        title
      },
      callback
    )
  }

  static async runCommandAndIncrementProgress(
    command: () => Promise<string>,
    progress: Progress<{
      message?: string | undefined
      increment?: number | undefined
    }>,
    increment: number
  ) {
    const stdout = await command()

    progress.report({
      increment,
      message: stdout
    })
  }

  static reportProgressError(
    error: unknown,
    progress: Progress<{
      message?: string | undefined
      increment?: number | undefined
    }>
  ) {
    const message = (error as Error)?.message || 'an unexpected error occurred'

    progress.report({
      increment: 0,
      message
    })
    return Toast.delayProgressClosing(60000)
  }

  static delayProgressClosing(ms = 5000) {
    return delay(ms)
  }

  private static waitForResponse(
    level: Level,
    message: string,
    ...items: Response[]
  ): Thenable<Response | undefined> {
    return window[`show${level}Message`](message, ...items)
  }
}
