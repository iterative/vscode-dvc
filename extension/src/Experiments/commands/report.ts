import { window } from 'vscode'
import { reportErrorMessage } from '../../vscode/reporting'

export const report = async (stdout: Promise<string>) => {
  try {
    window.showInformationMessage((await stdout) || 'Operation successful.')
  } catch (e) {
    reportErrorMessage(e)
  }
}
