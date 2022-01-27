import { commands, window } from 'vscode'
import { setUserConfigValue } from './config'
import { recommendRedHatExtension } from './recommend'
import { Response } from './response'

const mockedShowInformationMessage = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.showInformationMessage = mockedShowInformationMessage
const mockedExecuteCommand = jest.fn()
const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = mockedExecuteCommand

const mockedSetUserConfigValue = jest.mocked(setUserConfigValue)

jest.mock('vscode')
jest.mock('./config')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('recommendRedHatExtension', () => {
  it('should set a user config option if the user responds with do not show again', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NEVER)
    await recommendRedHatExtension()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith(
      'dvc.doNotRecommendRedHatExtension',
      true
    )
  })

  it('should open the extensions view and search for the extension if the user responds with show', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.SHOW)
    mockedExecuteCommand.mockResolvedValueOnce(undefined)

    await recommendRedHatExtension()

    expect(mockedExecuteCommand).toBeCalledTimes(1)
    expect(mockedExecuteCommand).toBeCalledWith(
      'workbench.extensions.search',
      '@id:redhat.vscode-yaml'
    )
  })

  it('should not set any options if the user responds with no', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NO)
    await recommendRedHatExtension()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await recommendRedHatExtension()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })
})
