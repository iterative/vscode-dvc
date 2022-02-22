import { window } from 'vscode'
import { Response } from './response'

export enum ReportLevel {
  ERROR = 'Error',
  WARNING = 'Warning'
}

export const reportWithOptions = (
  level: ReportLevel,
  message: string,
  ...items: Response[]
) => window[`show${level}Message`](message, ...items)

export const reportError = (message: string): Promise<undefined> => {
  window.showErrorMessage(message)
  return Promise.resolve(undefined)
}

export const reportOutput = async (
  stdout: Promise<string | undefined>
): Promise<void> => {
  const output = (await stdout) || 'Operation successful.'
  window.showInformationMessage(output)
}
