import { LATEST_TESTED_CLI_VERSION } from './contract'
import { CliCompatible, isVersionCompatible } from './version'
import { IExtensionSetup } from '../../interfaces'
import { Toast } from '../../vscode/toast'
import { Response } from '../../vscode/response'
import {
  ConfigKey,
  getConfigValue,
  setUserConfigValue
} from '../../vscode/config'
import { getFirstWorkspaceFolder } from '../../vscode/workspaceFolders'
import { delay } from '../../util/time'
import { SetupSection } from '../../setup/webview/contract'

const warnWithSetupAction = async (
  setup: IExtensionSetup,
  warningText: string
): Promise<void> => {
  const response = await Toast.warnWithOptions(warningText, Response.SHOW_SETUP)

  if (response === Response.SHOW_SETUP) {
    return setup.showSetup(SetupSection.DVC)
  }
}

export const warnUnableToVerifyVersion = (setup: IExtensionSetup) => {
  void warnWithSetupAction(
    setup,
    'The extension cannot initialize as we were unable to verify the DVC CLI version.'
  )
}

export const warnVersionIncompatible = (
  setup: IExtensionSetup,
  update: 'CLI' | 'extension'
): void => {
  void warnWithSetupAction(
    setup,
    `The extension cannot initialize because you are using the wrong version of the ${update}.`
  )
}

export const warnAheadOfLatestTested = (): void => {
  void Toast.warnWithOptions(
    `The located DVC CLI is at least a minor version ahead of the latest version the extension was tested with (${LATEST_TESTED_CLI_VERSION}). This could lead to unexpected behaviour. Please upgrade to the most recent version of the extension and reload this window.`
  )
}

const warnUserCLIInaccessible = async (
  setup: IExtensionSetup
): Promise<void> => {
  if (getConfigValue<boolean>(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE)) {
    return
  }

  const response = await Toast.warnWithOptions(
    'An error was thrown when trying to access the CLI.',
    Response.SHOW_SETUP,
    Response.NEVER
  )

  switch (response) {
    case Response.SHOW_SETUP:
      return setup.showSetup(SetupSection.DVC)
    case Response.NEVER:
      return setUserConfigValue(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE, true)
  }
}

const warnUser = (
  setup: IExtensionSetup,
  cliCompatible: CliCompatible
): void => {
  if (!setup.shouldWarnUserIfCLIUnavailable()) {
    return
  }
  switch (cliCompatible) {
    case CliCompatible.NO_BEHIND_MIN_VERSION:
      return warnVersionIncompatible(setup, 'CLI')
    case CliCompatible.NO_CANNOT_VERIFY:
      void warnUnableToVerifyVersion(setup)
      return
    case CliCompatible.NO_MAJOR_VERSION_AHEAD:
      return warnVersionIncompatible(setup, 'extension')
    case CliCompatible.NO_NOT_FOUND:
      void warnUserCLIInaccessible(setup)
      return
    case CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED:
      return warnAheadOfLatestTested()
  }
}

type CanRunCli = {
  isAvailable: boolean
  isCompatible: boolean | undefined
  version: string | undefined
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
  isAvailable: boolean,
  isCompatible: boolean | undefined,
  version: string | undefined
): CanRunCli => {
  warnUser(setup, cliCompatible)

  return {
    isAvailable,
    isCompatible,
    version
  }
}

const tryGlobalFallbackVersion = async (
  setup: IExtensionSetup,
  cwd: string
): Promise<CanRunCli> => {
  const tryGlobal = await getVersionDetails(setup, cwd, true)
  const { cliCompatible, isAvailable, isCompatible, version } = tryGlobal

  if (isCompatible) {
    setup.unsetPythonBinPath()
  }

  return processVersionDetails(
    setup,
    cliCompatible,
    isAvailable,
    isCompatible,
    version
  )
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
    pythonVersionIsAvailable,
    pythonVersionIsCompatible,
    pythonVersion
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
    isAvailable,
    isCompatible,
    version
  )
}

const checkVersion = async (
  setup: IExtensionSetup,
  cwd: string,
  checkGlobal?: true
) => {
  const version = await setup.getCliVersion(cwd, checkGlobal)
  const cliCompatible = isVersionCompatible(version)
  return isCliCompatible(cliCompatible)
}

export const recheck = async (
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

  let isCompatible = await checkVersion(setup, cwd)
  if (!isCompatible) {
    isCompatible = await checkVersion(setup, cwd, true)
  }

  if (!isCompatible) {
    return recheck(setup, run, recheckInterval)
  }

  void run()
}
