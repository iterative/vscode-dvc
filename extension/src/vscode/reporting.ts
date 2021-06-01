import { window } from 'vscode'
import { MaybeConsoleError } from '../cli/error'

const reportErrorMessage = (error: MaybeConsoleError) =>
  window.showErrorMessage(error.stderr || error.message)

export const report = async (stdout: Promise<string>) => {
  try {
    window.showInformationMessage((await stdout) || 'Operation successful.')
  } catch (e) {
    reportErrorMessage(e)
  }
}
