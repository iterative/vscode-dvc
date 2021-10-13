import { mocked } from 'ts-jest/utils'
import { commands, window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import {
  askUserToAddSchema,
  askUserToAssociateYaml,
  recommendRedHatExtension
} from './recommend'
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

describe('askUserToAssociateYaml', () => {
  it('should set a user config option if the user responds with do not show again', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NEVER)
    await askUserToAssociateYaml()

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
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith('files.associations', {
      '*.dvc': 'yaml',
      '*.wat': 'perl',
      'dvc.lock': 'yaml'
    })
  })

  it('should not set any options if the user responds with no', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NO)
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })
})

describe('askUserToAddSchema', () => {
  it('should set a user config option if the user responds with do not show again', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NEVER)
    await askUserToAddSchema()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith(
      'dvc.doNotAddDvcYamlSchema',
      true
    )
  })

  it('should add dvc.yaml the schema if the user confirms', async () => {
    const originalConfig = {
      'https://github.com/OAI/OpenAPI-Specification/blob/main/schemas/v3.0/schema.yaml':
        'openApi.yaml'
    }

    mockedShowInformationMessage.mockResolvedValueOnce(Response.YES)
    mockedGetConfigValue.mockReturnValueOnce(originalConfig)
    await askUserToAddSchema()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith('yaml.schemas', {
      'https://github.com/OAI/OpenAPI-Specification/blob/main/schemas/v3.0/schema.yaml':
        'openApi.yaml',
      'https://raw.githubusercontent.com/iterative/dvcyaml-schema/master/schema.json':
        'dvc.yaml'
    })
  })

  it('should not set any options if the user responds with no', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NO)
    await askUserToAddSchema()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await askUserToAddSchema()

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
