import { IExtension } from './interfaces'
import {
  quickPickOneOrInput,
  quickPickValue,
  quickPickYesOrNo
} from './vscode/quickPick'
import {
  ConfigKey,
  getConfigValue,
  setConfigValue,
  setUserConfigValue
} from './vscode/config'
import { pickFile } from './vscode/resourcePicker'
import { getFirstWorkspaceFolder } from './vscode/workspaceFolders'
import { Response } from './vscode/response'
import { getSelectTitle, Title } from './vscode/title'
import { Toast } from './vscode/toast'
import {
  getPythonBinPath,
  isPythonExtensionInstalled,
  selectPythonInterpreter
} from './extensions/python'
import {
  CliCompatible,
  isCliCompatible,
  EXPECTED_VERSION_TEXT,
  getTextAndSend,
  isVersionCompatible,
  warnAheadOfLatestTested
} from './cli/dvc/version'

const setConfigPath = async (
  option: ConfigKey,
  path: string | undefined
): Promise<true> => {
  await setConfigValue(option, path)
  return true
}

const setDvcPath = (path: string | undefined) =>
  setConfigPath(ConfigKey.DVC_PATH, path)

const enterPathOrFind = (text: string): Promise<string | undefined> =>
  quickPickOneOrInput(
    [
      {
        detail: `Browse the filesystem for a ${text}.`,
        label: 'Find...',
        value: 'pick'
      }
    ],
    {
      defaultValue: 'pick',
      placeholder: `Enter path to a ${text}`,
      title: Title.SETUP_WORKSPACE
    }
  )

const findPath = async (option: ConfigKey, text: string) => {
  const title = getSelectTitle(text)
  const path = await pickFile(title)
  if (!path) {
    return false
  }
  return setConfigPath(option, path)
}

const enterPathOrPickFile = async (option: ConfigKey, description: string) => {
  const pickOrPath = await enterPathOrFind(description)

  if (pickOrPath === undefined) {
    return false
  }

  if (pickOrPath !== 'pick') {
    return setConfigPath(option, pickOrPath)
  }

  return findPath(option, description)
}

const pickCliPath = async () => {
  const isGlobal = await quickPickYesOrNo(
    "DVC can be located via the system's PATH environment variable",
    'I need to specify a path',
    { placeHolder: 'Is DVC available globally?', title: Title.SETUP_WORKSPACE }
  )

  if (isGlobal === undefined) {
    return false
  }

  if (isGlobal) {
    return setDvcPath('dvc')
  }

  return enterPathOrPickFile(ConfigKey.DVC_PATH, 'DVC CLI')
}

const pickVenvOptions = async () => {
  const dvcInVenv = await quickPickYesOrNo(
    "all of the project's requirements are in the virtual environment",
    'this project needs access to a DVC CLI outside of the virtual environment',
    {
      placeHolder: 'Is DVC installed within the environment?',
      title: Title.SETUP_WORKSPACE
    }
  )
  if (dvcInVenv === undefined) {
    return false
  }

  if (dvcInVenv) {
    return setDvcPath(undefined)
  }

  return pickCliPath()
}

const quickPickVenvOption = () => {
  const options = [
    {
      description: '• Let me select the virtual environment manually',
      label: 'Manual',
      value: 1
    },
    {
      description: '• DVC is available globally (e.g. installed as a binary)',
      label: 'Global',
      value: 0
    }
  ]
  if (isPythonExtensionInstalled()) {
    options.unshift({
      description:
        '• Use the virtual environment detected automatically by the Python extension',
      label: 'Auto',
      value: 2
    })
  }

  return quickPickValue<number>(options, {
    placeHolder: 'Select an environment where DVC is installed',
    title: Title.SETUP_WORKSPACE
  })
}

const quickPickOrUnsetPythonInterpreter = (usesVenv: number) => {
  if (usesVenv === 1) {
    return enterPathOrPickFile(ConfigKey.PYTHON_PATH, 'Python Interpreter')
  }

  return setConfigPath(ConfigKey.PYTHON_PATH, undefined)
}

export const setupWorkspace = async (): Promise<boolean> => {
  const usesVenv = await quickPickVenvOption()

  if (usesVenv === undefined) {
    return false
  }

  if (usesVenv) {
    if (!(await quickPickOrUnsetPythonInterpreter(usesVenv))) {
      return false
    }

    return pickVenvOptions()
  }

  return pickCliPath()
}

const getToastText = async (
  isPythonExtensionInstalled: boolean
): Promise<string> => {
  const text = 'An error was thrown when trying to access the CLI.'
  if (!isPythonExtensionInstalled) {
    return text
  }
  const binPath = await getPythonBinPath()

  return (
    text +
    ` For auto Python environment activation ensure the correct interpreter is set. Active Python interpreter: ${binPath}. `
  )
}

const getToastOptions = (isPythonExtensionInstalled: boolean): Response[] => {
  return isPythonExtensionInstalled
    ? [Response.SETUP_WORKSPACE, Response.SELECT_INTERPRETER, Response.NEVER]
    : [Response.SETUP_WORKSPACE, Response.NEVER]
}

const warnUserCLIInaccessible = async (
  extension: IExtension,
  isMsPythonInstalled: boolean,
  warningText: string
): Promise<void> => {
  if (getConfigValue<boolean>(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE)) {
    return
  }

  const response = await Toast.warnWithOptions(
    warningText,
    ...getToastOptions(isMsPythonInstalled)
  )

  switch (response) {
    case Response.SELECT_INTERPRETER:
      return selectPythonInterpreter()
    case Response.SETUP_WORKSPACE:
      return extension.setupWorkspace()
    case Response.NEVER:
      return setUserConfigValue(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE, true)
  }
}

const warnUserCLIInaccessibleAnywhere = (
  extension: IExtension,
  globalDvcVersion: string | undefined
): Promise<void> => {
  return warnUserCLIInaccessible(
    extension,
    isPythonExtensionInstalled(),
    `The extension is unable to access an appropriate version of the CLI. No version was located using the Python extension. ${
      globalDvcVersion || 'No version'
    } was located globally. ${EXPECTED_VERSION_TEXT}`
  )
}

const warnUser = async (
  extension: IExtension,
  cliCompatible: CliCompatible,
  version: string | undefined
) => {
  if (!extension.hasRoots()) {
    return
  }
  switch (cliCompatible) {
    case CliCompatible.NO_BEHIND_MIN_VERSION:
      return getTextAndSend(version as string, 'CLI')
    case CliCompatible.NO_CANNOT_VERIFY:
      Toast.warnWithOptions(
        'The extension cannot initialize as we were unable to verify the DVC CLI version.'
      )
      return
    case CliCompatible.NO_MAJOR_VERSION_AHEAD:
      return getTextAndSend(version as string, 'extension')
    case CliCompatible.NO_NOT_FOUND: {
      const isMsPythonInstalled = isPythonExtensionInstalled()
      return warnUserCLIInaccessible(
        extension,
        isPythonExtensionInstalled(),
        await getToastText(isMsPythonInstalled)
      )
    }
    case CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED:
      return warnAheadOfLatestTested()
  }
}

const getVersionDetails = async (
  extension: IExtension,
  cwd: string,
  tryGlobalCli?: true
): Promise<{
  cliCompatible: CliCompatible
  isAvailable: boolean
  isCompatible: boolean | undefined
  version: string | undefined
}> => {
  const version = await extension.getCliVersion(cwd, tryGlobalCli)
  const cliCompatible = isVersionCompatible(version)
  const isCompatible = isCliCompatible(cliCompatible)
  return { cliCompatible, isAvailable: !!isCompatible, isCompatible, version }
}

const processVersionDetails = (
  extension: IExtension,
  cliCompatible: CliCompatible,
  version: string | undefined,
  isAvailable: boolean,
  isCompatible: boolean | undefined
): { isAvailable: boolean; isCompatible: boolean | undefined } => {
  warnUser(extension, cliCompatible, version)
  return {
    isAvailable,
    isCompatible
  }
}

const tryGlobalFallbackVersion = async (
  extension: IExtension,
  cwd: string
): Promise<{ isAvailable: boolean; isCompatible: boolean | undefined }> => {
  const { cliCompatible, isAvailable, isCompatible, version } =
    await getVersionDetails(extension, cwd, true)

  if (extension.hasRoots() && !isCompatible) {
    warnUserCLIInaccessibleAnywhere(extension, version)
  }
  if (
    extension.hasRoots() &&
    cliCompatible === CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  ) {
    warnAheadOfLatestTested()
  }

  if (isCompatible) {
    extension.unsetPythonBinPath()
  }

  return { isAvailable, isCompatible }
}

const extensionCanAutoRunCli = async (
  extension: IExtension,
  cwd: string
): Promise<{ isAvailable: boolean; isCompatible: boolean | undefined }> => {
  const {
    cliCompatible: pythonCliCompatible,
    isAvailable: pythonVersionIsAvailable,
    isCompatible: pythonVersionIsCompatible,
    version: pythonVersion
  } = await getVersionDetails(extension, cwd)

  if (pythonCliCompatible === CliCompatible.NO_NOT_FOUND) {
    return tryGlobalFallbackVersion(extension, cwd)
  }
  return processVersionDetails(
    extension,
    pythonCliCompatible,
    pythonVersion,
    pythonVersionIsAvailable,
    pythonVersionIsCompatible
  )
}

const extensionCanRunCli = async (
  extension: IExtension,
  cwd: string
): Promise<{ isAvailable: boolean; isCompatible: boolean | undefined }> => {
  if (await extension.isPythonExtensionUsed()) {
    return extensionCanAutoRunCli(extension, cwd)
  }

  const { cliCompatible, isAvailable, isCompatible, version } =
    await getVersionDetails(extension, cwd)

  return processVersionDetails(
    extension,
    cliCompatible,
    version,
    isAvailable,
    isCompatible
  )
}

export const setup = async (extension: IExtension) => {
  const cwd = getFirstWorkspaceFolder()
  if (!cwd) {
    return
  }

  extension.setRoots()

  const { isAvailable, isCompatible } = await extensionCanRunCli(extension, cwd)

  extension.setCliCompatible(isCompatible)

  if (extension.hasRoots() && isAvailable) {
    extension.setAvailable(isAvailable)
    return extension.initialize()
  }

  extension.resetMembers()

  if (!isAvailable) {
    extension.setAvailable(false)
  }
}
