import { window } from 'vscode'
import { reportErrorMessage } from '../../vscode/reporting'

export const report = async (
  func: (cwd: string, experimentName: string) => Promise<string>,
  cwd: string,
  selectedExperimentName: string
) => {
  try {
    window.showInformationMessage(
      (await func(cwd, selectedExperimentName)) || 'Operation successful.'
    )
  } catch (e) {
    reportErrorMessage(e)
  }
}

export const report_ = (stdout = 'Operation successful.') =>
  window.showInformationMessage(stdout)
