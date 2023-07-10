import { Extension, commands, extensions, window } from 'vscode'
import { ConfigKey, setUserConfigValue } from './config'
import {
  recommendMermaidSupportExtension,
  recommendRedHatExtension
} from './recommend'
import { Response } from './response'

const mockedShowInformationMessage = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.showInformationMessage = mockedShowInformationMessage
const mockedExecuteCommand = jest.fn()
const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = mockedExecuteCommand
const mockedExtensions = jest.mocked(extensions)
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

    expect(mockedSetUserConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedSetUserConfigValue).toHaveBeenCalledWith(
      ConfigKey.DO_NOT_RECOMMEND_RED_HAT,
      true
    )
  })

  it('should open the extensions view and search for the extension if the user responds with show', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.SHOW)
    mockedExecuteCommand.mockResolvedValueOnce(undefined)

    await recommendRedHatExtension()

    expect(mockedExecuteCommand).toHaveBeenCalledTimes(1)
    expect(mockedExecuteCommand).toHaveBeenCalledWith(
      'workbench.extensions.search',
      '@id:redhat.vscode-yaml'
    )
  })

  it('should not set any options if the user responds with no', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NO)
    await recommendRedHatExtension()

    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await recommendRedHatExtension()

    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
  })
})

describe('recommendMermaidSupportExtension', () => {
  it('should return early if the extension is installed', async () => {
    mockedExtensions.all = [
      { id: 'bierner.markdown-mermaid' }
    ] as unknown as readonly Extension<unknown>[] & {
      [x: number]: Extension<unknown>
    } & { [x: number]: jest.MockedObjectDeep<Extension<unknown>> }
    await recommendMermaidSupportExtension()
    expect(mockedShowInformationMessage).not.toHaveBeenCalled()
  })

  it('should set a user config option if the user responds with do not show again', async () => {
    mockedExtensions.all = []
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NEVER)
    await recommendMermaidSupportExtension()

    expect(mockedSetUserConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedSetUserConfigValue).toHaveBeenCalledWith(
      ConfigKey.DO_NOT_RECOMMEND_MERMAID_SUPPORT,
      true
    )
  })

  it('should open the extensions view and search for the extension if the user responds with show', async () => {
    mockedExtensions.all = []
    mockedShowInformationMessage.mockResolvedValueOnce(Response.SHOW)
    mockedExecuteCommand.mockResolvedValueOnce(undefined)

    await recommendMermaidSupportExtension()

    expect(mockedExecuteCommand).toHaveBeenCalledTimes(1)
    expect(mockedExecuteCommand).toHaveBeenCalledWith(
      'workbench.extensions.search',
      '@id:bierner.markdown-mermaid'
    )
  })

  it('should not set any options if the user responds with no', async () => {
    mockedExtensions.all = []
    mockedShowInformationMessage.mockResolvedValueOnce(Response.NO)
    await recommendMermaidSupportExtension()

    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedExtensions.all = []
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await recommendMermaidSupportExtension()

    expect(mockedSetUserConfigValue).not.toHaveBeenCalled()
  })
})
