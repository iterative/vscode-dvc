import { mocked } from 'ts-jest/utils'
import { window } from 'vscode'
import { setup } from './setup'

const mockedCanRunCli = jest.fn()
const mockedHasWorkspaceFolder = jest.fn()
const mockedInitialize = jest.fn()
const mockedInitializePreCheck = jest.fn()
const mockedReset = jest.fn()

const mockedWindow = mocked(window)
const mockedShowInformationMessage = jest.fn()
mockedWindow.showInformationMessage = mockedShowInformationMessage

beforeEach(() => {
  jest.resetAllMocks()
})

describe('setup', () => {
  it('should always run the pre check initialization', async () => {
    const extension = {
      canRunCli: mockedCanRunCli,
      hasWorkspaceFolder: mockedHasWorkspaceFolder,
      initialize: mockedInitialize,
      initializePreCheck: mockedInitializePreCheck,
      reset: mockedReset
    }

    mockedCanRunCli.mockResolvedValueOnce(false)
    mockedHasWorkspaceFolder.mockResolvedValueOnce(true)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
  })

  it('should run the initialization if the cli can be run', async () => {
    const extension = {
      canRunCli: mockedCanRunCli,
      hasWorkspaceFolder: mockedHasWorkspaceFolder,
      initialize: mockedInitialize,
      initializePreCheck: mockedInitializePreCheck,
      reset: mockedReset
    }

    mockedCanRunCli.mockResolvedValueOnce(true)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(0)
    expect(mockedInitialize).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).not.toBeCalled()
  })

  it('should run reset and alert the user if the cli cannot be run but there is a workspace folder open', async () => {
    const extension = {
      canRunCli: mockedCanRunCli,
      hasWorkspaceFolder: mockedHasWorkspaceFolder,
      initialize: mockedInitialize,
      initializePreCheck: mockedInitializePreCheck,
      reset: mockedReset
    }

    mockedCanRunCli.mockResolvedValueOnce(false)
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).toBeCalledTimes(1)
  })

  it('should run reset but not alert the user if the cli cannot be run but there is no workspace folder open', async () => {
    const extension = {
      canRunCli: mockedCanRunCli,
      hasWorkspaceFolder: mockedHasWorkspaceFolder,
      initialize: mockedInitialize,
      initializePreCheck: mockedInitializePreCheck,
      reset: mockedReset
    }

    mockedCanRunCli.mockResolvedValueOnce(false)
    mockedHasWorkspaceFolder.mockReturnValueOnce(false)

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).not.toBeCalled()
  })
})
