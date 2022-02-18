import { window } from 'vscode'

export const reportErrorWithOptions = (
  message: string,
  ...items: string[]
): Thenable<string | undefined> => window.showErrorMessage(message, ...items)

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
  ...items: string[]
): Thenable<string | undefined> => window.showWarningMessage(message, ...items)
