import { resolve } from 'path'
import { extensions, Extension, commands } from 'vscode'
import { setup, setupWithGlobalRecheck, setupWorkspace } from './setup'
import { flushPromises } from './test/util/jest'
import {
  ConfigKey,
  getConfigValue,
  setConfigValue,
  setUserConfigValue
} from './vscode/config'
import { pickFile } from './vscode/resourcePicker'
import {
  quickPickOneOrInput,
  quickPickValue,
  quickPickYesOrNo
} from './vscode/quickPick'
import { getFirstWorkspaceFolder } from './vscode/workspaceFolders'
import { Toast } from './vscode/toast'
import { Response } from './vscode/response'
import { VscodePython } from './extensions/python'
import { executeProcess } from './processExecution'
import {
  LATEST_TESTED_CLI_VERSION,
  MAX_CLI_VERSION,
  MIN_CLI_VERSION
} from './cli/dvc/constants'
import { extractSemver, ParsedSemver } from './cli/dvc/version'
import { delay } from './util/time'
import { Title } from './vscode/title'

jest.mock('vscode')
jest.mock('./vscode/config')
jest.mock('./vscode/resourcePicker')
jest.mock('./vscode/quickPick')
jest.mock('./vscode/toast')
jest.mock('./vscode/workspaceFolders')
jest.mock('./processExecution')

const mockedExtensions = jest.mocked(extensions)
const mockedCommands = jest.mocked(commands)
const mockedExecuteCommand = jest.fn()
mockedCommands.executeCommand = mockedExecuteCommand

const mockedExecuteProcess = jest.mocked(executeProcess)

const mockedGetExtension = jest.fn()
mockedExtensions.getExtension = mockedGetExtension

const mockedReady = jest.fn()

const mockedPythonPath = 'python'
const mockedSettings = {
  getExecutionDetails: () => ({
    execCommand: [mockedPythonPath]
  })
}

const mockedVscodePythonAPI = {
  ready: mockedReady,
  settings: mockedSettings
} as unknown as VscodePython

const mockedVscodePython = {
  activate: () => Promise.resolve(mockedVscodePythonAPI)
}

const mockedCwd = __dirname
const mockedGetAvailable = jest.fn()
const mockedGetCliVersion = jest.fn()
const mockedGetFirstWorkspaceFolder = jest.mocked(getFirstWorkspaceFolder)
const mockedHasRoots = jest.fn()
const mockedGetRoots = jest.mocked(() => [])
const mockedInitialize = jest.fn()
const mockedIsPythonExtensionUsed = jest.fn()
const mockedResetMembers = jest.fn()
const mockedSetAvailable = jest.fn()
const mockedSetCliCompatible = jest.fn()
const mockedSetRoots = jest.fn()
const mockedShowSetup = jest.fn()
const mockedShouldWarnUserIfCLIUnavailable = jest.fn()
const mockedUnsetPythonBinPath = jest.fn()

const mockedSetConfigToUsePythonExtension = jest.fn()

const mockedQuickPickYesOrNo = jest.mocked(quickPickYesOrNo)
const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedSetConfigValue = jest.mocked(setConfigValue)
const mockedQuickPickOneOrInput = jest.mocked(quickPickOneOrInput)
const mockedPickFile = jest.mocked(pickFile)

const mockedToast = jest.mocked(Toast)
const mockedWarnWithOptions = jest.fn()
mockedToast.warnWithOptions = mockedWarnWithOptions

const mockedGetConfigValue = jest.mocked(getConfigValue)
const mockedSetUserConfigValue = jest.mocked(setUserConfigValue)

beforeEach(() => {
  jest.resetAllMocks()
  mockedExtensions.all = [
    { id: 'ms-python.python' }
  ] as unknown as readonly Extension<unknown>[] & {
    [x: number]: Extension<unknown>
  } & { [x: number]: jest.MockedObjectDeep<Extension<unknown>> }
})

describe('setupWorkspace', () => {
  it('should present two options if the python extension is installed (Auto & Global)', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        expect.objectContaining({ label: 'Auto' }),
        expect.objectContaining({ label: 'Global' })
      ],
      {
        placeHolder: 'Select an environment where DVC is installed',
        title: Title.SETUP_WORKSPACE
      }
    )
  })

  it('should present two options if the python extension is NOT installed (Manual & Global)', async () => {
    mockedExtensions.all = []

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        expect.objectContaining({ label: 'Manual' }),
        expect.objectContaining({ label: 'Global' })
      ],
      {
        placeHolder: 'Select an environment where DVC is installed',
        title: Title.SETUP_WORKSPACE
      }
    )
  })

  it('should set the dvc path and python path options to undefined if the CLI is being auto detected inside a virtual environment', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigToUsePythonExtension).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DVC_PATH,
      undefined
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.PYTHON_PATH,
      undefined
    )
  })

  it('should return without setting any options if the dialog is cancelled at the virtual environment without DVC step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickOneOrInput.mockResolvedValueOnce(undefined)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).not.toHaveBeenCalled()
  })

  it("should set the dvc path option to dvc if there is a virtual environment which doesn't include the CLI but it is available globally", async () => {
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickYesOrNo
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
    mockedQuickPickOneOrInput.mockResolvedValueOnce('pick')
    mockedPickFile.mockResolvedValueOnce(mockedPythonPath)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedSetConfigToUsePythonExtension).not.toHaveBeenCalled()
    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(1)
    expect(mockedPickFile).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.PYTHON_PATH,
      mockedPythonPath
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(ConfigKey.DVC_PATH, 'dvc')
  })

  it('should return without setting any options if the dialog is cancelled at the virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).not.toHaveBeenCalled()
  })

  it("should set the dvc path option to the picked file's path if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickOneOrInput
      .mockResolvedValueOnce('pick')
      .mockResolvedValueOnce('pick')
    mockedPickFile
      .mockResolvedValueOnce(mockedPythonPath)
      .mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(2)
    expect(mockedPickFile).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.PYTHON_PATH,
      mockedPythonPath
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DVC_PATH,
      mockedDvcPath
    )
  })

  it('should not set the python or dvc path options if the user cancels the dialog at the pick a python interpreter step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickOneOrInput.mockResolvedValueOnce(undefined)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).not.toHaveBeenCalled()
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).not.toHaveBeenCalled()
  })
  it("should set the python and dvc path options to the picked file's path if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedPythonPath = resolve('some', 'path', 'to', 'python')
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickOneOrInput.mockResolvedValueOnce('pick')
    mockedPickFile.mockResolvedValueOnce(mockedPythonPath)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickOneOrInput.mockResolvedValueOnce('pick')
    mockedPickFile.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace(mockedSetConfigToUsePythonExtension)

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(2)
    expect(mockedPickFile).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.PYTHON_PATH,
      mockedPythonPath
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DVC_PATH,
      mockedDvcPath
    )
  })
})

describe('setup', () => {
  const extension = {
    getAvailable: mockedGetAvailable,
    getCliVersion: mockedGetCliVersion,
    getRoots: mockedGetRoots,
    hasRoots: mockedHasRoots,
    initialize: mockedInitialize,
    isPythonExtensionUsed: mockedIsPythonExtensionUsed,
    resetMembers: mockedResetMembers,
    setAvailable: mockedSetAvailable,
    setCliCompatible: mockedSetCliCompatible,
    setRoots: mockedSetRoots,
    shouldWarnUserIfCLIUnavailable: mockedShouldWarnUserIfCLIUnavailable,
    showSetup: mockedShowSetup,
    unsetPythonBinPath: mockedUnsetPythonBinPath
  }

  it('should do nothing if there is no workspace folder', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(undefined)

    await setup(extension)

    expect(mockedGetCliVersion).not.toHaveBeenCalled()
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should set the DVC roots even if the cli cannot be used', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(false)

    await setup(extension)

    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
  })

  it('should not alert the user if the workspace has no DVC project and the cli cannot be found', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(false)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(undefined)

    await setup(extension)
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).not.toHaveBeenCalled()
    expect(mockedWarnWithOptions).not.toHaveBeenCalled()
    expect(mockedShowSetup).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should not alert the user if the workspace contains a DVC project, the cli cannot be found and the do not show option is set', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    mockedGetConfigValue.mockReturnValueOnce(true)

    await setup(extension)
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).not.toHaveBeenCalled()
    expect(mockedShowSetup).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should alert the user if the workspace contains a DVC project and the cli cannot be found', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should show the setup webview if the workspace contains a DVC project, the cli cannot be found and the user selects setup', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    mockedWarnWithOptions.mockResolvedValueOnce(Response.SHOW_SETUP)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedShowSetup).toHaveBeenCalledTimes(1)
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should set a user config option if the workspace contains a DVC project, the cli cannot be found and the user selects never', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(undefined)
    mockedWarnWithOptions.mockResolvedValueOnce(Response.NEVER)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedShowSetup).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should not send telemetry or set the cli as unavailable or run initialization if roots have not been found but the cli can be run', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(false)
    mockedHasRoots.mockReturnValueOnce(false)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(MIN_CLI_VERSION)

    await setup(extension)
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedSetAvailable).not.toHaveBeenCalledWith(false)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should run initialization if roots have been found and the cli can be run', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(MIN_CLI_VERSION)

    await setup(extension)
    expect(mockedResetMembers).not.toHaveBeenCalled()
    expect(mockedInitialize).toHaveBeenCalledTimes(1)
  })

  it('should call the cli to see if it is available from path if the Python extension is being used and the first call fails', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(MIN_CLI_VERSION)

    await setup(extension)
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(2)
    expect(mockedResetMembers).not.toHaveBeenCalled()
    expect(mockedInitialize).toHaveBeenCalledTimes(1)
  })

  it('should send a specific message to the user if the Python extension is being used, the CLI is not available in the virtual environment and the global CLI is not compatible', async () => {
    const belowMinVersion = '2.0.0'
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedGetExtension.mockReturnValue(mockedVscodePython)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(belowMinVersion)

    await setup(extension)
    await flushPromises()
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledWith(
      `The extension is unable to initialize. The CLI was not located using the interpreter provided by the Python extension. ${belowMinVersion} is installed globally. For auto Python environment activation, ensure the correct interpreter is set. Active Python interpreter: ${mockedPythonPath}.`,
      Response.SHOW_SETUP,
      Response.NEVER
    )
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(2)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should send a specific message and initialize if the Python extension is being used, the CLI is not available in the virtual environment and the global CLI is a minor version ahead of the expected version', async () => {
    const { major, minor, patch } = extractSemver(
      LATEST_TESTED_CLI_VERSION
    ) as ParsedSemver
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedShouldWarnUserIfCLIUnavailable
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([major, minor + 1, patch].join('.'))

    await setup(extension)
    await flushPromises()
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledWith(
      `The located DVC CLI is at least a minor version ahead of the latest version the extension was tested with (${LATEST_TESTED_CLI_VERSION}). This could lead to unexpected behaviour. Please upgrade to the most recent version of the extension and reload this window.`
    )
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(2)
    expect(mockedResetMembers).not.toHaveBeenCalled()
    expect(mockedInitialize).toHaveBeenCalledTimes(1)
  })

  it('should send a specific message to the user if the Python extension is not being used and the CLI is not available', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedExtensions.all = []
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(undefined)

    await setup(extension)
    await flushPromises()
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledWith(
      'An error was thrown when trying to access the CLI.',
      Response.SHOW_SETUP,
      Response.NEVER
    )
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should send a specific message to the user if the located CLI is a major version ahead', async () => {
    const MajorAhead = MIN_CLI_VERSION.split('.')
      .map(num => Number(num) + 100)
      .join('.')
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(MajorAhead)

    await setup(extension)
    await flushPromises()
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledWith(
      `The extension cannot initialize because you are using version ${MajorAhead} of the DVC CLI. The expected version is ${MIN_CLI_VERSION} <= DVC < ${MAX_CLI_VERSION}. Please upgrade to the most recent version of the extension and reload this window.`
    )
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should send a specific message to the user if the Python extension is being used, the CLI is not available in the virtual environment and no cli is found globally', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedGetExtension.mockReturnValue(mockedVscodePython)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)

    await setup(extension)
    await flushPromises()
    expect(mockedWarnWithOptions).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).toHaveBeenCalledWith(
      `The extension is unable to initialize. The CLI was not located using the interpreter provided by the Python extension. The CLI is also not installed globally. For auto Python environment activation, ensure the correct interpreter is set. Active Python interpreter: ${mockedPythonPath}.`,
      Response.SHOW_SETUP,
      Response.NEVER
    )
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(2)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should only call the cli once if the python extension is not used', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(false)

    await setup(extension)
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
  })

  it('should not attempt to find the cli globally if the python extension is used and the found version is behind', async () => {
    const [major] = MIN_CLI_VERSION.split('.')
    const behind = [major, 0, 0].join('.')
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(behind)

    await setup(extension)
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
  })

  it('should run reset if the cli cannot be run and there is a workspace folder open', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedShouldWarnUserIfCLIUnavailable.mockReturnValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(false)

    await setup(extension)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })
})

describe('setupWithGlobalRecheck', () => {
  const extension = {
    getAvailable: mockedGetAvailable,
    getCliVersion: mockedGetCliVersion,
    getRoots: mockedGetRoots,
    hasRoots: mockedHasRoots,
    initialize: mockedInitialize,
    isPythonExtensionUsed: mockedIsPythonExtensionUsed,
    resetMembers: mockedResetMembers,
    setAvailable: mockedSetAvailable,
    setCliCompatible: mockedSetCliCompatible,
    setRoots: mockedSetRoots,
    shouldWarnUserIfCLIUnavailable: mockedShouldWarnUserIfCLIUnavailable,
    showSetup: mockedShowSetup,
    unsetPythonBinPath: mockedUnsetPythonBinPath
  }

  it('should periodically check to see if the CLI is available globally if the extension fails to initialize', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValue(mockedCwd)

    const mockedRecheckInterval = 0

    mockedGetAvailable
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)

    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(LATEST_TESTED_CLI_VERSION)
      .mockResolvedValueOnce(LATEST_TESTED_CLI_VERSION)

    await setupWithGlobalRecheck(extension, mockedRecheckInterval)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(1)

    await delay(mockedRecheckInterval)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(2)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(2)

    await delay(mockedRecheckInterval)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(4)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(3)

    await delay(mockedRecheckInterval)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(4)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(3)
  })

  it('should not periodically check to see if the CLI is available globally if the extension initializes', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValue(mockedCwd)

    mockedGetAvailable.mockReturnValueOnce(true)

    mockedGetCliVersion.mockResolvedValueOnce(LATEST_TESTED_CLI_VERSION)

    await setupWithGlobalRecheck(extension, 0)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(1)

    await delay(0)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(1)

    await delay(0)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(1)
  })

  it('should stop checking if the extension is available globally if it initializes', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValue(mockedCwd)

    mockedGetAvailable.mockReturnValueOnce(false).mockReturnValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(undefined)

    await setupWithGlobalRecheck(extension, 0)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(1)

    await delay(0)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(2)

    await delay(0)

    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
    expect(mockedGetAvailable).toHaveBeenCalledTimes(2)
  })
})
