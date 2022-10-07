import { join, resolve } from 'path'
import { extensions, Extension, commands } from 'vscode'
import { setup, setupWorkspace } from './setup'
import { flushPromises } from './test/util/jest'
import {
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
import { MIN_CLI_VERSION } from './cli/dvc/constants'

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

const mockedSettings = {
  getExecutionDetails: () => ({
    execCommand: [join('some', 'bin', 'path')]
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
const mockedGetCliVersion = jest.fn()
const mockedGetFirstWorkspaceFolder = jest.mocked(getFirstWorkspaceFolder)
const mockedHasRoots = jest.fn()
const mockedInitialize = jest.fn()
const mockedIsPythonExtensionUsed = jest.fn()
const mockedResetMembers = jest.fn()
const mockedSetAvailable = jest.fn()
const mockedSetCliCompatible = jest.fn()
const mockedSetRoots = jest.fn()
const mockedSetupWorkspace = jest.fn()
const mockedUnsetPythonBinPath = jest.fn()

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
  it('should return without setting any options if the dialog is cancelled at the virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).not.toHaveBeenCalled()
  })

  it('should return without setting any options if the dialog is cancelled at the DVC in virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.pythonPath',
      undefined
    )
  })

  it('should set the dvc path option to undefined if the CLI is installed in a virtual environment', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(true)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledWith('dvc.dvcPath', undefined)
  })

  it('should return without setting any options if the dialog is cancelled at the virtual environment without DVC step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.pythonPath',
      undefined
    )
  })

  it("should set the dvc path option to dvc if there is a virtual environment which doesn't include the CLI but it is available globally", async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(true)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.pythonPath',
      undefined
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith('dvc.dvcPath', 'dvc')
  })

  it("should set the dvc path option to the entered value if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickOneOrInput.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(1)
    expect(mockedPickFile).not.toHaveBeenCalled()
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.pythonPath',
      undefined
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.dvcPath',
      mockedDvcPath
    )
  })

  it("should set the dvc path option to the picked file's path if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickOneOrInput.mockResolvedValueOnce('pick')
    mockedPickFile.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(1)
    expect(mockedPickFile).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.pythonPath',
      undefined
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.dvcPath',
      mockedDvcPath
    )
  })

  it('should not set the python or dvc path options if the user cancels the dialog at the pick a python interpreter step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickOneOrInput.mockResolvedValueOnce(undefined)

    await setupWorkspace()

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

    await setupWorkspace()

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(2)
    expect(mockedPickFile).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledTimes(2)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.pythonPath',
      mockedPythonPath
    )
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      'dvc.dvcPath',
      mockedDvcPath
    )
  })
})

describe('setup', () => {
  const extension = {
    getCliVersion: mockedGetCliVersion,
    hasRoots: mockedHasRoots,
    initialize: mockedInitialize,
    isPythonExtensionUsed: mockedIsPythonExtensionUsed,
    resetMembers: mockedResetMembers,
    setAvailable: mockedSetAvailable,
    setCliCompatible: mockedSetCliCompatible,
    setRoots: mockedSetRoots,
    setupWorkspace: mockedSetupWorkspace,
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
    expect(mockedSetupWorkspace).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should not alert the user if the workspace contains a DVC project, the cli cannot be found and the do not show option is set', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    mockedGetConfigValue.mockReturnValueOnce(true)

    await setup(extension)
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedWarnWithOptions).not.toHaveBeenCalled()
    expect(mockedSetupWorkspace).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should alert the user if the workspace contains a DVC project and the cli cannot be found', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
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

  it('should try to setup the workspace if the workspace contains a DVC project, the cli cannot be found and the user selects setup the workspace', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    mockedWarnWithOptions.mockResolvedValueOnce(Response.SETUP_WORKSPACE)
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
    expect(mockedSetupWorkspace).toHaveBeenCalledTimes(1)
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should try to select the python interpreter if the workspace contains a DVC project, the cli cannot be found and the user decides to select the python interpreter', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(undefined)
    mockedWarnWithOptions.mockResolvedValueOnce(Response.SELECT_INTERPRETER)
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
    expect(mockedSetupWorkspace).toHaveBeenCalledTimes(0)
    expect(mockedExecuteCommand).toHaveBeenCalledTimes(1)
    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should set a user config option if the workspace contains a DVC project, the cli cannot be found and the user selects never', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
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
    expect(mockedSetupWorkspace).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).toHaveBeenCalledTimes(0)
    expect(mockedSetUserConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should not send telemetry or set the cli as unavailable or run initialization if roots have not been found but the cli can be run', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(false).mockReturnValueOnce(false)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(MIN_CLI_VERSION)

    await setup(extension)
    expect(mockedSetRoots).toHaveBeenCalledTimes(1)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedSetAvailable).not.toHaveBeenCalled()
    expect(mockedInitialize).not.toHaveBeenCalled()
  })

  it('should run initialization if roots have been found and the cli can be run', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true).mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(MIN_CLI_VERSION)

    await setup(extension)
    expect(mockedResetMembers).not.toHaveBeenCalled()
    expect(mockedInitialize).toHaveBeenCalledTimes(1)
  })

  it('should call the cli to see if it is available from path if the Python extension is being used and the first call fails', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedGetCliVersion
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(MIN_CLI_VERSION)

    await setup(extension)
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(2)
    expect(mockedResetMembers).not.toHaveBeenCalled()
    expect(mockedInitialize).toHaveBeenCalledTimes(1)
  })

  it('should only call the cli once if the python extension is not used', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(false)
    mockedGetCliVersion.mockResolvedValueOnce(false)

    await setup(extension)
    expect(mockedGetCliVersion).toHaveBeenCalledTimes(1)
  })

  it('should run reset if the cli cannot be run and there is a workspace folder open', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedIsPythonExtensionUsed.mockResolvedValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedGetCliVersion.mockResolvedValueOnce(false)

    await setup(extension)
    expect(mockedResetMembers).toHaveBeenCalledTimes(1)
    expect(mockedInitialize).not.toHaveBeenCalled()
  })
})
