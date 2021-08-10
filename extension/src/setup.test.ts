import { mocked } from 'ts-jest/utils'
import { window, workspace } from 'vscode'
import { setup } from './setup'

jest.mock('vscode')

const mockedCanRunCli = jest.fn()
const mockedHasRoots = jest.fn()
const mockedHasWorkspaceFolder = jest.fn()
const mockedInitialize = jest.fn()
const mockedInitializePreCheck = jest.fn()
const mockedReset = jest.fn()

const mockedWindow = mocked(window)
const mockedShowInformationMessage = jest.fn()
mockedWindow.showInformationMessage = mockedShowInformationMessage
const mockedWorkspace = mocked(workspace)
const mockedGetConfiguration = jest.fn()
mockedWorkspace.getConfiguration = mockedGetConfiguration

beforeEach(() => {
  jest.resetAllMocks()
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
    mockedGetConfiguration.mockImplementationOnce(() => ({ get: jest.fn() }))

    await setup(extension)

    expect(mockedInitializePreCheck).not.toBeCalled()
    expect(mockedCanRunCli).not.toBeCalled()
    expect(mockedInitialize).not.toBeCalled()
  })

  it('should run the pre check initialization even if the cli cannot be used', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)
    mockedGetConfiguration.mockImplementationOnce(() => ({ get: jest.fn() }))

    await setup(extension)

    expect(mockedInitializePreCheck).toBeCalledTimes(1)
  })

  it('should not run initialization if roots have not been found but the cli can be run', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(false)
    mockedCanRunCli.mockResolvedValueOnce(true)
    mockedGetConfiguration.mockImplementationOnce(() => ({ get: jest.fn() }))

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).toBeCalledTimes(1)
  })

  it('should run initialization if roots have been found and the cli can be run', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(true)
    mockedGetConfiguration.mockImplementationOnce(() => ({ get: jest.fn() }))

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).not.toBeCalled()
    expect(mockedInitialize).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).not.toBeCalled()
  })

  it('should run reset and alert the user if the cli cannot be run and there is a workspace folder open', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)
    mockedGetConfiguration.mockImplementationOnce(() => ({ get: jest.fn() }))

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).toBeCalledTimes(1)
  })

  it('should run reset, alert the user and set the noCLIUnavailableInfo option if directed', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)
    const mockedUpdate = jest.fn()
    mockedGetConfiguration
      .mockImplementationOnce(() => ({ get: jest.fn() }))
      .mockImplementationOnce(() => ({ update: mockedUpdate }))
    mockedShowInformationMessage.mockResolvedValueOnce("Don't show again")

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedUpdate).toBeCalledWith('dvc.noCLIUnavailableInfo', true)
  })

  it('should run reset and not alert the user if the cli cannot be run and the noCLIUnavailableInfo option is set', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(false)
    mockedGetConfiguration.mockImplementationOnce(() => ({
      get: (option: string) => {
        expect(option).toEqual('dvc.noCLIUnavailableInfo')
        return true
      }
    }))

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).not.toBeCalled()
  })
})
