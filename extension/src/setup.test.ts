import { resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { setup, setupWorkspace } from './setup'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/pickFile'
import { quickPickOneOrInput, quickPickValue } from './vscode/quickPick'

jest.mock('./vscode/config')
jest.mock('./vscode/pickFile')
jest.mock('./vscode/quickPick')

const mockedCanRunCli = jest.fn()
const mockedHasRoots = jest.fn()
const mockedHasWorkspaceFolder = jest.fn()
const mockedInitialize = jest.fn()
const mockedInitializePreCheck = jest.fn()
const mockedReset = jest.fn()

const mockedQuickPickValue = mocked(quickPickValue)
const mockedSetConfigValue = mocked(setConfigValue)
const mockedQuickPickOneWithInput = mocked(quickPickOneOrInput)
const mockedPickFile = mocked(pickFile)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('setupWorkspace', () => {
  it('should return without setting any options if the dialog is cancelled at the virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(1)
    expect(mockedSetConfigValue).not.toBeCalled()
  })

  it('should return without setting any options if the dialog is cancelled at the DVC in virtual environment step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(true)
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(2)
    expect(mockedSetConfigValue).not.toBeCalled()
  })

  it('should set the dvc path option to undefined if the CLI is installed in a virtual environment', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(true)
    mockedQuickPickValue.mockResolvedValueOnce(true)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(2)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', undefined)
  })

  it('should return without setting any options if the dialog is cancelled at the virtual environment without DVC step', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(true)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(3)
    expect(mockedSetConfigValue).not.toBeCalled()
  })

  it("should set the dvc path option to dvc if there is a virtual environment that doesn't include a globally available CLI", async () => {
    mockedQuickPickValue.mockResolvedValueOnce(true)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    mockedQuickPickValue.mockResolvedValueOnce(true)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(3)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', 'dvc')
  })

  it("should set the dvc path option to the entered value if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(true)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    mockedQuickPickOneWithInput.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(3)
    expect(mockedQuickPickOneWithInput).toBeCalledTimes(1)
    expect(mockedPickFile).not.toBeCalled()
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', mockedDvcPath)
  })

  it("should set the dvc path option to the picked value if there is a virtual environment that doesn't include a CLI and there is no global option", async () => {
    const mockedDvcPath = resolve('some', 'path', 'to', 'dvc')
    mockedQuickPickValue.mockResolvedValueOnce(true)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    mockedQuickPickOneWithInput.mockResolvedValueOnce('pick')
    mockedPickFile.mockResolvedValueOnce(mockedDvcPath)

    await setupWorkspace()

    expect(mockedQuickPickValue).toBeCalledTimes(3)
    expect(mockedQuickPickOneWithInput).toBeCalledTimes(1)
    expect(mockedPickFile).toBeCalledTimes(1)
    expect(mockedSetConfigValue).toBeCalledWith('dvc.dvcPath', mockedDvcPath)
  })
})

describe('setup', () => {
  const extension = {
    canRunCli: mockedCanRunCli,
    hasRoots: mockedHasRoots,
    hasWorkspaceFolder: mockedHasWorkspaceFolder,
    initialize: mockedInitialize,
    initializePreCheck: mockedInitializePreCheck,
    reset: mockedReset
  }

  it('should do nothing if there is no workspace folder', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(false)

    await setup(extension)

    expect(mockedInitializePreCheck).not.toBeCalled()
    expect(mockedCanRunCli).not.toBeCalled()
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should run the pre check initialization even if the cli cannot be used', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)

    await setup(extension)

    expect(mockedInitializePreCheck).toBeCalledTimes(1)
  })

  it('should not run initialization if roots have not been found but the cli can be run', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(false)
    mockedCanRunCli.mockResolvedValueOnce(true)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should run initialization if roots have been found and the cli can be run', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(true)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).not.toBeCalled()
    expect(mockedInitialize).toBeCalledTimes(1)
  })

  it('should run reset if the cli cannot be run and there is a workspace folder open', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
  })
})
