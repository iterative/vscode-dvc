import { window } from 'vscode'

export const reportErrorWithOptions = (message: string, ...items: string[]) =>
  window.showErrorMessage(message, ...items)

export const reportOutput = async (stdout: Promise<string>) => {
  const output = (await stdout) || 'Operation successful.'
  window.showInformationMessage(output)
}
