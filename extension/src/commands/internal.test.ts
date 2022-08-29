import { AvailableCommands, CommandId, InternalCommands } from './internal'
import { ICli } from '../cli'
import { OutputChannel } from '../vscode/outputChannel'

const mockedOutputChannel = {
  show: jest.fn()
} as unknown as OutputChannel

beforeEach(() => {
  jest.resetAllMocks()
})

describe('InternalCommands', () => {
  const internalCommands = new InternalCommands(mockedOutputChannel)

  describe('executeCommand', () => {
    it('should throw an error if we try to run a non-registered command', () => {
      expect(() =>
        internalCommands.executeCommand('not a command' as CommandId, __dirname)
      ).toThrow()
    })
  })

  describe('registerCommand', () => {
    it('should throw an error if we try to re-register an existing command', () => {
      internalCommands.registerCommand(AvailableCommands.ADD, jest.fn())
      expect(() => {
        internalCommands.registerCommand(AvailableCommands.ADD, jest.fn())
      }).toThrow()
    })
  })

  describe('autoRegisteredCommands', () => {
    it('should throw an error if we try to auto-register a cli object without adding to the AvailableCommands', () => {
      const mockedCli = {
        autoRegisteredCommands: ['func'],
        func: jest.fn()
      } as unknown as ICli

      expect(
        () => new InternalCommands(mockedOutputChannel, mockedCli)
      ).toThrow()
    })
  })
})
