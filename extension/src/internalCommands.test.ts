import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from './internalCommands'
import { ICli } from './cli'
import { Config } from './config'

const mockedConfig = {
  getDefaultProject: jest.fn()
} as unknown as Config

beforeEach(() => {
  jest.resetAllMocks()
})

describe('InternalCommands', () => {
  const internalCommands = new InternalCommands(mockedConfig)

  describe('executeCommand', () => {
    it('should throw an error if we try to run a non-registered command', () => {
      expect(() =>
        internalCommands.executeCommand('not a command' as CommandId)
      ).toThrow()
    })
  })

  describe('registerCommand', () => {
    it('should throw an error if we try to re-register an existing command', () => {
      expect(() =>
        internalCommands.registerCommand(
          AvailableCommands.GET_DEFAULT_OR_PICK_PROJECT,
          jest.fn()
        )
      ).toThrow()
    })
  })

  describe('autoRegisteredCommands', () => {
    it('should throw an error if we try to auto-register a cli object without adding to the AvailableCommands', () => {
      const mockedCli = {
        autoRegisteredCommands: ['func'],
        func: jest.fn()
      } as unknown as ICli

      expect(() => new InternalCommands(mockedConfig, mockedCli)).toThrow()
    })
  })
})
