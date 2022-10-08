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
  warnVersionIncompatible,
  isVersionCompatible,
  warnAheadOfLatestTested,
  warnUnableToVerifyVersion
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

const warnUserCLIInaccessibleAnywhere = async (
  extension: IExtension,
  globalDvcVersion: string | undefined
): Promise<void> => {
  const binPath = await getPythonBinPath()

  return warnUserCLIInaccessible(
    extension,
    true,
    `The extension is unable to access an appropriate version of the CLI. The CLI was not located using the interpreter provided by the Python extension. ${
      globalDvcVersion ? globalDvcVersion + ' is' : 'The CLI is also not'
    } installed globally. For auto Python environment activation ensure the correct interpreter is set. Active Python interpreter: ${binPath}.`
  )
}

const warnUser = (
  extension: IExtension,
  cliCompatible: CliCompatible,
  version: string | undefined
): void => {
  if (!extension.hasRoots()) {
    return
  }
  switch (cliCompatible) {
    case CliCompatible.NO_BEHIND_MIN_VERSION:
      return warnVersionIncompatible(version as string, 'CLI')
    case CliCompatible.NO_CANNOT_VERIFY:
      warnUnableToVerifyVersion()
      return
    case CliCompatible.NO_MAJOR_VERSION_AHEAD:
      return warnVersionIncompatible(version as string, 'extension')
    case CliCompatible.NO_NOT_FOUND:
      warnUserCLIInaccessible(
        extension,
        isPythonExtensionInstalled(),
        'An error was thrown when trying to access the CLI.'
      )
      return
    case CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED:
      return warnAheadOfLatestTested()
  }
}

type CanRunCli = {
  isAvailable: boolean
  isCompatible: boolean | undefined
}

const getVersionDetails = async (
  extension: IExtension,
  cwd: string,
  tryGlobalCli?: true
): Promise<
  CanRunCli & {
    cliCompatible: CliCompatible
    version: string | undefined
  }
> => {
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
): CanRunCli => {
  warnUser(extension, cliCompatible, version)
  return {
    isAvailable,
    isCompatible
  }
}

const tryGlobalFallbackVersion = async (
  extension: IExtension,
  cwd: string
): Promise<CanRunCli> => {
  const tryGlobal = await getVersionDetails(extension, cwd, true)
  const { cliCompatible, isAvailable, isCompatible, version } = tryGlobal

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
): Promise<CanRunCli> => {
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
): Promise<CanRunCli> => {
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
