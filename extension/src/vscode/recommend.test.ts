import { mocked } from 'ts-jest/utils'
import { commands, window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { recommendAssociateYaml, recommendRedHatExtension } from './recommend'
import { Response } from './response'

const mockedShowInformationMessage = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.showInformationMessage = mockedShowInformationMessage
const mockedExecuteCommand = jest.fn()
const mockedCommands = mocked(commands)
mockedCommands.executeCommand = mockedExecuteCommand

const mockedSetUserConfigValue = mocked(setUserConfigValue)
const mockedGetConfigValue = mocked(getConfigValue)

jest.mock('vscode')
jest.mock('./config')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('recommendAssociateYaml', () => {
  it('should set a user config option if the user responds with do not show again', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NEVER)
    await recommendAssociateYaml()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith(
      'dvc.doNotAssociateYaml',
      true
    )
  })

  it('should associate the file types with yaml if the user confirms', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.YES)
    mockedGetConfigValue.mockReturnValueOnce({
      '*.wat': 'perl'
    })
    await recommendAssociateYaml()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith('files.associations', {
      '*.dvc': 'yaml',
      '*.wat': 'perl',
      'dvc.lock': 'yaml'
    })
  })

  it('should not set any options if the user responds with no', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NO)
    await recommendAssociateYaml()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await recommendAssociateYaml()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })
})

describe('recommendRedHatExtension', () => {
  it('should set a user config option if the user responds with do not show again', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NEVER)
    await recommendRedHatExtension()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith(
      'dvc.doNotRecommendRedHat',
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
