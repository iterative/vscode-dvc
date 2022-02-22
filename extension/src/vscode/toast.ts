import { window } from 'vscode'
import { Response } from './response'

export enum ToastLevel {
  INFORMATION = 'Information',
  ERROR = 'Error',
  WARNING = 'Warning'
}

export const report = (
  level: ToastLevel,
  message: string,
  ...items: Response[]
) => window[`show${level}Message`](message, ...items)

export const reportError = (message: string): Promise<undefined> => {
  report(ToastLevel.ERROR, message)
  return Promise.resolve(undefined)
}

export const reportOutput = async (
  stdout: Promise<string | undefined>
): Promise<void> => {
  const output = (await stdout) || 'Operation successful.'
  report(ToastLevel.INFORMATION, output)
}

export const askShowOrCloseOrNever = (
  message: string
): Thenable<string | undefined> =>
  report(
    ToastLevel.INFORMATION,
    message,
    Response.SHOW,
    Response.CLOSE,
    Response.NEVER
  )
