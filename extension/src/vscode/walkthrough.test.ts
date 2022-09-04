import { commands } from 'vscode'
import { showWalkthroughOnFirstUse } from './walkthrough'
import { ConfigKey, getConfigValue, setUserConfigValue } from './config'
import { Toast } from './toast'
import { Response } from './response'
import { RegisteredCommands } from '../commands/external'

jest.mock('vscode')
jest.mock('./toast')
jest.mock('./config')

const mockedCommands = jest.mocked(commands)
const mockedExecuteCommand = jest.fn()
mockedCommands.executeCommand = mockedExecuteCommand

const mockedGetConfigValue = jest.mocked(getConfigValue)
const mockedSetConfigValue = jest.mocked(setUserConfigValue)

const mockedToast = jest.mocked(Toast)
const mockedAskShowOrCloseOrNever = jest.fn()
mockedToast.askShowOrCloseOrNever = mockedAskShowOrCloseOrNever

beforeEach(() => {
  jest.resetAllMocks()
})

describe('showWalkthroughOnFirstUse', () => {
  it('should ask to show the walkthrough after a new install', async () => {
    await showWalkthroughOnFirstUse(true)
    expect(mockedAskShowOrCloseOrNever).toHaveBeenCalledTimes(1)
  })

  it('should not ask to show the walkthrough when the install is not new', async () => {
    await showWalkthroughOnFirstUse(false)
    expect(mockedAskShowOrCloseOrNever).not.toHaveBeenCalled()
  })

  it('should not ask to show the walkthrough when the user has set a config option', async () => {
    mockedGetConfigValue.mockReturnValueOnce(true)
    await showWalkthroughOnFirstUse(true)
    expect(mockedAskShowOrCloseOrNever).not.toHaveBeenCalled()
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DO_NOT_SHOW_WALKTHROUGH_AFTER_INSTALL
    )
  })

  it('should set the config option if the user responds with never', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(Response.NEVER)
    await showWalkthroughOnFirstUse(true)

    expect(mockedSetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DO_NOT_SHOW_WALKTHROUGH_AFTER_INSTALL,
      true
    )
  })

  it('should show the walkthrough if the user responds with show', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(Response.SHOW)
    await showWalkthroughOnFirstUse(true)

    expect(mockedSetConfigValue).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).toHaveBeenCalledWith(
      RegisteredCommands.EXTENSION_GET_STARTED
    )
  })

  it('should take no action if the user closes the dialog', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(undefined)
    await showWalkthroughOnFirstUse(true)

    expect(mockedSetConfigValue).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
  })

  it('should take no action if the user respond with close', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(Response.CLOSE)
    await showWalkthroughOnFirstUse(true)

    expect(mockedSetConfigValue).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
  })
})
