import {
  Environment,
  getActiveEnvironmentInfo,
  getPythonExecutionDetails
} from '../extensions/python'
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

export const findPythonEnvInfoForInstall = async (): Promise<
  Environment | undefined
> => {
  const manualPython = getConfigValue(ConfigKey.PYTHON_PATH)
  const autoPythonDetails = await getPythonExecutionDetails()

  const isPythonExtensionUsed = !manualPython && !!autoPythonDetails?.join('')
  const pythonExtensionActiveEnv = await getActiveEnvironmentInfo()

  return isPythonExtensionUsed ? pythonExtensionActiveEnv : undefined
}

const showUpgradeProgress = (
  root: string,
  pythonBinPath: string,
  envInfo?: Environment
): Thenable<unknown> =>
  Toast.showProgress('Upgrading DVC', async progress => {
    progress.report({ increment: 0 })

    progress.report({ increment: 25, message: 'Updating packages...' })

    try {
      await Toast.runCommandAndIncrementProgress(
        async () => {
          await installPackages(root, pythonBinPath, envInfo, 'dvc')
          return 'Upgraded successfully'
        },
        progress,
        75
      )

      return Toast.delayProgressClosing()
    } catch (error: unknown) {
      return Toast.reportProgressError(error, progress)
    }
  })

const showInstallProgress = (
  root: string,
  pythonBinPath: string,
  envInfo: Environment
): Thenable<unknown> =>
  Toast.showProgress('Installing packages', async progress => {
    progress.report({ increment: 0 })

    try {
      await Toast.runCommandAndIncrementProgress(
        async () => {
          await installPackages(root, pythonBinPath, envInfo, 'dvclive')
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
          await installPackages(root, pythonBinPath, envInfo, 'dvc')
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

const getArgsAndRunCommand = async (
  command: (
    root: string,
    pythonBinPath: string,
    envInfo: Environment | undefined
  ) => Thenable<unknown>
): Promise<unknown> => {
  const pythonBinPath = await findPythonBinForInstall()
  const root = getFirstWorkspaceFolder()
  const pythonEnvInfo = await findPythonEnvInfoForInstall()

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

  return command(root, pythonBinPath, pythonEnvInfo)
}

export const autoInstallDvc = (): Promise<unknown> => {
  return getArgsAndRunCommand(showInstallProgress)
}

export const autoUpgradeDvc = (): Promise<unknown> => {
  return getArgsAndRunCommand(showUpgradeProgress)
}
