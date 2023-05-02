import { getPythonExecutionDetails } from '../extensions/python'
import { findPythonBin, getDefaultPython, installPackages } from '../python'
import { ConfigKey, getConfigValue } from '../vscode/config'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { Toast } from '../vscode/toast'

export const findPythonBinForInstall = async (): Promise<
  string | undefined
> => {
  const manualPython = getConfigValue(ConfigKey.PYTHON_PATH)

  const autoPythonDetails = await getPythonExecutionDetails()

  return findPythonBin(
    manualPython || autoPythonDetails?.join('') || getDefaultPython()
  )
}

const showInstallProgress = (
  root: string,
  pythonBinPath: string
): Thenable<unknown> =>
  Toast.showProgress('Installing packages', async progress => {
    progress.report({ increment: 0 })

    try {
      await Toast.runCommandAndIncrementProgress(
        async () => {
          await installPackages(root, pythonBinPath, 'dvclive')
          return 'DVCLive Installed'
        },
        progress,
        25
      )
    } catch (error: unknown) {
      return Toast.reportProgressError(error, progress)
    }

    try {
      await Toast.runCommandAndIncrementProgress(
        async () => {
          await installPackages(root, pythonBinPath, 'dvc')
          return 'DVC Installed'
        },
        progress,
        75
      )

      return Toast.delayProgressClosing()
    } catch (error: unknown) {
      return Toast.reportProgressError(error, progress)
    }
  })

export const autoInstallDvc = async (): Promise<unknown> => {
  const pythonBinPath = await findPythonBinForInstall()
  const root = getFirstWorkspaceFolder()

  if (!root) {
    return Toast.showError(
      'DVC could not be auto-installed because there is no folder open in the workspace'
    )
  }

  if (!pythonBinPath) {
    return Toast.showError(
      'DVC could not be auto-installed because a Python interpreter could not be located'
    )
  }

  return showInstallProgress(root, pythonBinPath)
}
