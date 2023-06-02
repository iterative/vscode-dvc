import { commands } from 'vscode'
import { showSetupOnFirstUse } from './util'
import { ConfigKey, getConfigValue, setUserConfigValue } from '../vscode/config'
import { Toast } from '../vscode/toast'
import { Response } from '../vscode/response'
import { RegisteredCommands } from '../commands/external'
import { buildMockMemento } from '../test/util'
import { GlobalPersistenceKey, PersistenceKey } from '../persistence/constants'
import { DEFAULT_HEIGHT } from '../plots/webview/contract'

jest.mock('vscode')
jest.mock('../vscode/toast')
jest.mock('../vscode/config')

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

describe('showSetupOnFirstUse', () => {
  it('should set a global state key after a new install', async () => {
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(globalState.get(GlobalPersistenceKey.INSTALLED)).toStrictEqual(true)
  })

  it('should ask to show the setup page after a new install', async () => {
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(mockedAskShowOrCloseOrNever).toHaveBeenCalledTimes(1)
  })

  it('should not ask to show the setup page when the install is not new', async () => {
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento({
      [GlobalPersistenceKey.INSTALLED]: true
    })

    await showSetupOnFirstUse(globalState, workspaceState)
    expect(mockedAskShowOrCloseOrNever).not.toHaveBeenCalled()
  })

  it('should not ask to show the setup page when the workspace state has data even if the global install key is not set', async () => {
    const workspaceState = buildMockMemento({
      [PersistenceKey.PLOT_HEIGHT + 'root1']: DEFAULT_HEIGHT
    })
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(mockedAskShowOrCloseOrNever).not.toHaveBeenCalled()
  })

  it('should not ask to show the setup page when the user has set a config option', async () => {
    mockedGetConfigValue.mockReturnValueOnce(true)
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)
    expect(mockedAskShowOrCloseOrNever).not.toHaveBeenCalled()
    expect(mockedGetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedGetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DO_NOT_SHOW_SETUP_AFTER_INSTALL
    )
  })

  it('should set the config option if the user responds with never', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(Response.NEVER)
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(mockedSetConfigValue).toHaveBeenCalledTimes(1)
    expect(mockedSetConfigValue).toHaveBeenCalledWith(
      ConfigKey.DO_NOT_SHOW_SETUP_AFTER_INSTALL,
      true
    )
  })

  it('should show the setup page if the user responds with show', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(Response.SHOW)
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(mockedSetConfigValue).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).toHaveBeenCalledWith(
      RegisteredCommands.SETUP_SHOW
    )
  })

  it('should take no action if the user closes the dialog', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(undefined)
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(mockedSetConfigValue).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
  })

  it('should take no action if the user respond with close', async () => {
    mockedAskShowOrCloseOrNever.mockResolvedValueOnce(Response.CLOSE)
    const workspaceState = buildMockMemento()
    const globalState = buildMockMemento()

    await showSetupOnFirstUse(globalState, workspaceState)

    expect(mockedSetConfigValue).not.toHaveBeenCalled()
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
  })
})
