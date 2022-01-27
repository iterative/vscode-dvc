import { commands } from 'vscode'
import { setContextValue } from './context'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
const mockedExecuteCommand = jest.fn()
mockedCommands.executeCommand = mockedExecuteCommand

beforeEach(() => {
  jest.resetAllMocks()
})

describe('setContextValue', () => {
  it('should pass the correct details to executeCommand', () => {
    const key = 'my important key'
    const value = 'value that if not set everything breaks'
    setContextValue(key, value)
    expect(mockedExecuteCommand).toBeCalledWith('setContext', key, value)
  })
})
