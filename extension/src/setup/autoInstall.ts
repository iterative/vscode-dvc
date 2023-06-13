import {
  getPythonExecutionDetails,
  isActivePythonEnvGlobal
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

const getProcessGlobalArgs = (isGlobal: boolean) => (isGlobal ? ['--user'] : [])

const showUpgradeProgress = (
  root: string,
  pythonBinPath: string,
  isGlobalEnv: boolean
): Thenable<unknown> =>
  Toast.showProgress('Upgrading DVC', async progress => {
    progress.report({ increment: 0 })

    progress.report({ increment: 25, message: 'Updating packages...' })

    try {
      await Toast.runCommandAndIncrementProgress(
        async () => {
          await installPackages(
            root,
            pythonBinPath,
            ...getProcessGlobalArgs(isGlobalEnv),
            'dvc'
          )
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
  isGlobalEnv: boolean
): Thenable<unknown> =>
  Toast.showProgress('Installing packages', async progress => {
    progress.report({ increment: 0 })

    try {
      await Toast.runCommandAndIncrementProgress(
        async () => {
          await installPackages(
            root,
            pythonBinPath,
            ...getProcessGlobalArgs(isGlobalEnv),
            'dvclive'
          )
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
          await installPackages(
            root,
            pythonBinPath,
            ...getProcessGlobalArgs(isGlobalEnv),
            'dvc'
          )
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
  isPythonExtensionUsed: boolean,
  command: (
    root: string,
    pythonBinPath: string,
    isGlobalEnv: boolean
  ) => Thenable<unknown>
): Promise<unknown> => {
  const pythonBinPath = await findPythonBinForInstall()
  const root = getFirstWorkspaceFolder()
  const isPythonEnvGlobal =
    isPythonExtensionUsed && (await isActivePythonEnvGlobal())

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

  return command(root, pythonBinPath, !!isPythonEnvGlobal)
}

export const autoInstallDvc = (
  isPythonExtensionUsed: boolean
): Promise<unknown> => {
  return getArgsAndRunCommand(isPythonExtensionUsed, showInstallProgress)
}

export const autoUpgradeDvc = (
  isPythonExtensionUsed: boolean
): Promise<unknown> => {
  return getArgsAndRunCommand(isPythonExtensionUsed, showUpgradeProgress)
}
