import { window } from 'vscode'
import { Response } from './response'

const reportWithOptions = (
  level: 'Error' | 'Warning',
  message: string,
  ...items: Response[]
) => window[`show${level}Message`](message, ...items)

export const reportErrorWithOptions = (
  message: string,
  ...items: Response[]
): Thenable<Response | undefined> =>
  reportWithOptions('Error', message, ...items)

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

export const reportWarningWithOptions = (
  message: string,
  ...items: Response[]
): Thenable<Response | undefined> =>
  reportWithOptions('Warning', message, ...items)
