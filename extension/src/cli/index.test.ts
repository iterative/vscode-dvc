import { EventEmitter } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { Cli, CliResult, typeCheckCommands } from '.'
import { Command } from './args'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import { Config } from '../config'
import { joinEnvPath } from '../util/paths'

jest.mock('vscode')
jest.mock('../env')
jest.mock('../processExecution')

const mockedGetEnv = mocked(getProcessEnv)
const mockedExecuteProcess = mocked(executeProcess)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('typeCheckCommands', () => {
  const cli = { func: jest.fn() } as unknown as Cli
  it('should throw an error when the command is not on the class', () => {
    expect(() =>
      typeCheckCommands(
        { FUNC: 'func', NOT_A_COMMAND: 'could not be a command' },
        cli
      )
    ).toThrow()
  })

  it('should not throw an error when the command is on the class', () => {
    expect(() => typeCheckCommands({ FUNC: 'func' }, cli)).not.toThrow()
  })

  it('should return the list of commands that are on the class', () => {
    const commandsToAutoRegister = typeCheckCommands({ FUNC: 'func' }, cli)
    expect(commandsToAutoRegister).toEqual(['func'])
  })
})

describe('executeProcess', () => {
  it('should pass the correct details to the underlying process given no path to the cli or python binary path', async () => {
    const existingPath = joinEnvPath(
      '/Users/robot/some/path',
      '/Users/robot/yarn/path'
    )
    const processEnv = { PATH: existingPath, SECRET_KEY: 'abc123' }
    const cwd = __dirname
    const args = [Command.CHECKOUT]
    mockedGetEnv.mockReturnValueOnce(processEnv)
    mockedExecuteProcess.mockResolvedValueOnce('done')
    const cli = new Cli(
      {
        getCliPath: () => undefined,
        pythonBinPath: undefined
      } as unknown as Config,
      {
        processCompleted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<CliResult>,
        processStarted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<void>
      }
    )

    await cli.executeProcess(cwd, ...args)

    expect(mockedExecuteProcess).toBeCalledWith({
      args,
      cwd,
      env: { ...processEnv, DVC_NO_ANALYTICS: 'true' },
      executable: 'dvc'
    })
  })

  it('should handle an error produced by the underlying process', async () => {
    const existingPath = joinEnvPath(
      '/Users/robot/some/path',
      '/Users/robot/yarn/path'
    )
    const pythonBinPath = '/some/path/to/python'
    const SECRET_KEY = 'abc123'
    const processEnv = { PATH: existingPath, SECRET_KEY }
    const cwd = __dirname
    const args = [Command.CHECKOUT]
    mockedGetEnv.mockReturnValueOnce(processEnv)
    mockedExecuteProcess.mockRejectedValueOnce({ stderr: 'I DEED' })
    const cli = new Cli(
      {
        getCliPath: () => '/some/path/to/dvc',
        pythonBinPath
      } as unknown as Config,
      {
        processCompleted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<CliResult>,
        processStarted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<void>
      }
    )

    await expect(cli.executeProcess(cwd, ...args)).rejects.toThrow()

    expect(mockedExecuteProcess).toBeCalledWith({
      args,
      cwd,
      env: {
        DVC_NO_ANALYTICS: 'true',
        PATH: joinEnvPath('/some/path/to', existingPath),
        SECRET_KEY
      },
      executable: '/some/path/to/dvc'
    })
  })
})
