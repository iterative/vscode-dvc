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

const mockedCanRunCli = jest.fn()
const mockedHasRoots = jest.fn()
const mockedGetFirstWorkspaceFolder = jest.mocked(getFirstWorkspaceFolder)
const mockedCwd = __dirname
const mockedInitialize = jest.fn()
const mockedResetMembers = jest.fn()
const mockedSetAvailable = jest.fn()
const mockedSetRoots = jest.fn()
const mockedSetupWorkspace = jest.fn()

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
    { id: 'ms-python.python' } as Extension<{ id: string }>
  ]
})

describe('setupWorkspace', () => {
  it('should return without setting any options if the dialog is cancelled at the virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedSetConfigValue).not.toBeCalled()
  })

  it('should return without setting any options if the dialog is cancelled at the DVC in virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(1)
    expect(mockedSetConfigValue).toBeCalledTimes(1)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.pythonPath', undefined)
  })

  it('should set the dvc path option to undefined if the CLI is installed in a virtual environment', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(true)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(1)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', undefined)
  })

  it('should return without setting any options if the dialog is cancelled at the virtual environment without DVC step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledTimes(1)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.pythonPath', undefined)
  })

  it("should set the dvc path option to dvc if there is a virtual environment which doesn't include the CLI but it is available globally", async () => {
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(true)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.pythonPath', undefined)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', 'dvc')
  })

  it("should set the dvc path option to the entered value if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickOneOrInput.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toBeCalledTimes(1)
    expect(mockedPickFile).not.toBeCalled()
    expect(mockedSetConfigValue).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.pythonPath', undefined)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', mockedDvcPath)
  })

  it("should set the dvc path option to the picked file's path if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(2)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickYesOrNo.mockResolvedValueOnce(false)
    mockedQuickPickOneOrInput.mockResolvedValueOnce('pick')
    mockedPickFile.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toBeCalledTimes(1)
    expect(mockedPickFile).toBeCalledTimes(1)
    expect(mockedSetConfigValue).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.pythonPath', undefined)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', mockedDvcPath)
  })

  it('should not set the python or dvc path options if the user cancels the dialog at the pick a python interpreter step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(1)
    mockedQuickPickOneOrInput.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).not.toBeCalled()
    expect(mockedQuickPickOneOrInput).toBeCalledTimes(1)
    expect(mockedSetConfigValue).not.toBeCalled()
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

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedQuickPickYesOrNo).toBeCalledTimes(2)
    expect(mockedQuickPickOneOrInput).toBeCalledTimes(2)
    expect(mockedPickFile).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledWith(
      'dvc.pythonPath',
      mockedPythonPath
    )
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', mockedDvcPath)
  })
})

describe('setup', () => {
  const extension = {
    canRunCli: mockedCanRunCli,
    hasRoots: mockedHasRoots,
    initialize: mockedInitialize,
    resetMembers: mockedResetMembers,
    setAvailable: mockedSetAvailable,
    setRoots: mockedSetRoots,
    setupWorkspace: mockedSetupWorkspace
  }

  it('should do nothing if there is no workspace folder', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(undefined)

    await setup(extension)

    expect(mockedCanRunCli).not.toBeCalled()
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should set the DVC roots even if the cli cannot be used', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedCanRunCli.mockResolvedValueOnce(false)

    await setup(extension)

    expect(mockedSetRoots).toBeCalledTimes(1)
  })

  it('should not alert the user if the workspace has no DVC project and the cli cannot be found', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(false)
    mockedCanRunCli.mockRejectedValueOnce(new Error('command not found: dvc'))

    await setup(extension)
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedGetConfigValue).not.toBeCalled()
    expect(mockedWarnWithOptions).not.toBeCalled()
    expect(mockedSetupWorkspace).not.toBeCalled()
    expect(mockedSetUserConfigValue).not.toBeCalled()
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should not alert the user if the workspace contains a DVC project, the cli cannot be found and the do not show option is set', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockRejectedValueOnce(new Error('command not found: dvc'))
    mockedGetConfigValue.mockReturnValueOnce(true)

    await setup(extension)
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedGetConfigValue).toBeCalledTimes(1)
    expect(mockedWarnWithOptions).not.toBeCalled()
    expect(mockedSetupWorkspace).not.toBeCalled()
    expect(mockedSetUserConfigValue).not.toBeCalled()
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should alert the user if the workspace contains a DVC project and the cli cannot be found', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockRejectedValueOnce(new Error('command not found: dvc'))
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedGetConfigValue).toBeCalledTimes(1)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should try to setup the workspace if the workspace contains a DVC project, the cli cannot be found and the user selects setup the workspace', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockRejectedValueOnce(new Error('command not found: dvc'))
    mockedWarnWithOptions.mockResolvedValueOnce(Response.SETUP_WORKSPACE)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedGetConfigValue).toBeCalledTimes(1)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
    expect(mockedSetupWorkspace).toBeCalledTimes(1)
    expect(mockedExecuteCommand).not.toBeCalled()
    expect(mockedSetUserConfigValue).not.toBeCalled()
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should try to select the python interpreter if the workspace contains a DVC project, the cli cannot be found and the user decides to select the python interpreter', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockRejectedValueOnce(new Error('command not found: dvc'))
    mockedWarnWithOptions.mockResolvedValueOnce(Response.SELECT_INTERPRETER)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedGetConfigValue).toBeCalledTimes(1)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
    expect(mockedSetupWorkspace).toBeCalledTimes(0)
    expect(mockedExecuteCommand).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).not.toBeCalled()
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should set a user config option if the workspace contains a DVC project, the cli cannot be found and the user selects never', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockRejectedValueOnce(new Error('command not found: dvc'))
    mockedWarnWithOptions.mockResolvedValueOnce(Response.NEVER)
    mockedExecuteProcess.mockImplementation(({ executable }) =>
      Promise.resolve(executable)
    )
    mockedReady.mockResolvedValue(true)
    mockedGetExtension.mockReturnValue(mockedVscodePython)

    await setup(extension)
    await flushPromises()
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedGetConfigValue).toBeCalledTimes(1)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
    expect(mockedSetupWorkspace).not.toBeCalled()
    expect(mockedExecuteCommand).not.toBeCalled()
    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should not send telemetry or set the cli as unavailable or run initialization if roots have not been found but the cli can be run', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(false)
    mockedCanRunCli.mockResolvedValueOnce(true)

    await setup(extension)
    expect(mockedSetRoots).toBeCalledTimes(1)
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedSetAvailable).not.toBeCalled()
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should run initialization if roots have been found and the cli can be run', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(true)

    await setup(extension)
    expect(mockedResetMembers).not.toBeCalled()
    expect(mockedInitialize).toBeCalledTimes(1)
  })

  it('should run reset if the cli cannot be run and there is a workspace folder open', async () => {
    mockedGetFirstWorkspaceFolder.mockReturnValueOnce(mockedCwd)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)

    await setup(extension)
    expect(mockedResetMembers).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })
})
