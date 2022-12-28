import {
  LATEST_TESTED_CLI_VERSION,
  MAX_CLI_VERSION,
  MIN_CLI_VERSION
} from './contract'
import { CliCompatible, isVersionCompatible } from './version'
import { IExtensionSetup } from '../../interfaces'
import { Toast } from '../../vscode/toast'
import { Response } from '../../vscode/response'
import {
  ConfigKey,
  getConfigValue,
  setUserConfigValue
} from '../../vscode/config'
import { getPythonBinPath } from '../../extensions/python'
import { getFirstWorkspaceFolder } from '../../vscode/workspaceFolders'
import { delay } from '../../util/time'

export const warnUnableToVerifyVersion = () =>
  Toast.warnWithOptions(
    'The extension cannot initialize as we were unable to verify the DVC CLI version.'
  )

export const warnVersionIncompatible = (
  version: string,
  update: 'CLI' | 'extension'
): void => {
  Toast.warnWithOptions(
    `The extension cannot initialize because you are using version ${version} of the DVC CLI. The expected version is ${MIN_CLI_VERSION} <= DVC < ${MAX_CLI_VERSION}. Please upgrade to the most recent version of the ${update} and reload this window.`
  )
}

export const warnAheadOfLatestTested = (): void => {
  Toast.warnWithOptions(
    `The located DVC CLI is at least a minor version ahead of the latest version the extension was tested with (${LATEST_TESTED_CLI_VERSION}). This could lead to unexpected behaviour. Please upgrade to the most recent version of the extension and reload this window.`
  )
}

const warnUserCLIInaccessible = async (
  setup: IExtensionSetup,
  warningText: string
): Promise<void> => {
  if (getConfigValue<boolean>(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE)) {
    return
  }

  const response = await Toast.warnWithOptions(
    warningText,
    Response.SHOW_SETUP,
    Response.NEVER
  )

  switch (response) {
    case Response.SHOW_SETUP:
      return setup.showSetup()
    case Response.NEVER:
      return setUserConfigValue(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE, true)
  }
}

const warnUserCLIInaccessibleAnywhere = async (
  setup: IExtensionSetup,
  globalDvcVersion: string | undefined
): Promise<void> => {
  const binPath = await getPythonBinPath()

  return warnUserCLIInaccessible(
    setup,
    `The extension is unable to initialize. The CLI was not located using the interpreter provided by the Python extension. ${
      globalDvcVersion ? globalDvcVersion + ' is' : 'The CLI is also not'
    } installed globally. For auto Python environment activation, ensure the correct interpreter is set. Active Python interpreter: ${binPath}.`
  )
}

const warnUser = (
  setup: IExtensionSetup,
  cliCompatible: CliCompatible,
  version: string | undefined
): void => {
  if (!setup.shouldWarnUserIfCLIUnavailable()) {
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
        setup,
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

export const isCliCompatible = (
  cliCompatible: CliCompatible
): boolean | undefined => {
  if (cliCompatible === CliCompatible.NO_NOT_FOUND) {
    return
  }

  return [
    CliCompatible.YES,
    CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  ].includes(cliCompatible)
}

const getVersionDetails = async (
  setup: IExtensionSetup,
  cwd: string,
  tryGlobalCli?: true
): Promise<
  CanRunCli & {
    cliCompatible: CliCompatible
    version: string | undefined
  }
> => {
  const version = await setup.getCliVersion(cwd, tryGlobalCli)
  const cliCompatible = isVersionCompatible(version)
  const isCompatible = isCliCompatible(cliCompatible)
  return { cliCompatible, isAvailable: !!isCompatible, isCompatible, version }
}

const processVersionDetails = (
  setup: IExtensionSetup,
  cliCompatible: CliCompatible,
  version: string | undefined,
  isAvailable: boolean,
  isCompatible: boolean | undefined
): CanRunCli => {
  warnUser(setup, cliCompatible, version)
  return {
    isAvailable,
    isCompatible
  }
}

const tryGlobalFallbackVersion = async (
  setup: IExtensionSetup,
  cwd: string
): Promise<CanRunCli> => {
  const tryGlobal = await getVersionDetails(setup, cwd, true)
  const { cliCompatible, isAvailable, isCompatible, version } = tryGlobal

  if (setup.shouldWarnUserIfCLIUnavailable() && !isCompatible) {
    warnUserCLIInaccessibleAnywhere(setup, version)
  }
  if (
    setup.shouldWarnUserIfCLIUnavailable() &&
    cliCompatible === CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  ) {
    warnAheadOfLatestTested()
  }

  if (isCompatible) {
    setup.unsetPythonBinPath()
  }

  return { isAvailable, isCompatible }
}

const extensionCanAutoRunCli = async (
  setup: IExtensionSetup,
  cwd: string
): Promise<CanRunCli> => {
  const {
    cliCompatible: pythonCliCompatible,
    isAvailable: pythonVersionIsAvailable,
    isCompatible: pythonVersionIsCompatible,
    version: pythonVersion
  } = await getVersionDetails(setup, cwd)

  if (pythonCliCompatible === CliCompatible.NO_NOT_FOUND) {
    return tryGlobalFallbackVersion(setup, cwd)
  }
  return processVersionDetails(
    setup,
    pythonCliCompatible,
    pythonVersion,
    pythonVersionIsAvailable,
    pythonVersionIsCompatible
  )
}

export const extensionCanRunCli = async (
  setup: IExtensionSetup,
  cwd: string
): Promise<CanRunCli> => {
  if (await setup.isPythonExtensionUsed()) {
    return extensionCanAutoRunCli(setup, cwd)
  }

  const { cliCompatible, isAvailable, isCompatible, version } =
    await getVersionDetails(setup, cwd)

  return processVersionDetails(
    setup,
    cliCompatible,
    version,
    isAvailable,
    isCompatible
  )
}

export const recheckGlobal = async (
  setup: IExtensionSetup,
  run: () => Promise<void[] | undefined>,
  recheckInterval: number
): Promise<void> => {
  await delay(recheckInterval)
  const roots = setup.getRoots()
  const cwd = roots.length > 0 ? roots[0] : getFirstWorkspaceFolder()

  if (!cwd || setup.getAvailable()) {
    return
  }

  const version = await setup.getCliVersion(cwd, true)
  const cliCompatible = isVersionCompatible(version)
  const isCompatible = isCliCompatible(cliCompatible)

  if (!isCompatible) {
    return recheckGlobal(setup, run, recheckInterval)
  }

  run()
}
