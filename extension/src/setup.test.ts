import { mocked } from 'ts-jest/utils'
import { window } from 'vscode'
import { setup } from './setup'

const mockedCanRunCli = jest.fn()
const mockedHasRoots = jest.fn()
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
    expect(mockedShowInformationMessage).toBeCalledTimes(1)
  })

  it('should run initialization if roots have been found and the cli can be run', async () => {
    mockedHasWorkspaceFolder.mockReturnValueOnce(true)
    mockedHasRoots.mockReturnValueOnce(true)
    mockedCanRunCli.mockResolvedValueOnce(true)

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

    await setup(extension)
    expect(mockedInitializePreCheck).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)
    expect(mockedInitialize).not.toBeCalled()
    expect(mockedShowInformationMessage).toBeCalledTimes(1)
  })
})
