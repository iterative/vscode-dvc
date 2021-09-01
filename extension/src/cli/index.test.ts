import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { Cli, CliResult, typeCheckCommands } from '.'
import { Command } from './args'
import { getProcessEnv } from '../env'
import { createProcess, Process } from '../processExecution'
import { Config } from '../config'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../env')
jest.mock('../processExecution')

const mockedDisposable = mocked(Disposable)

const mockedGetEnv = mocked(getProcessEnv)
const mockedCreateProcess = mocked(createProcess)

beforeEach(() => {
  jest.resetAllMocks()
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
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
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
    const processEnv = { PATH: existingPath, SECRET_KEY: 'abc123' }
    const cwd = __dirname
    const args = [Command.CHECKOUT]
    mockedGetEnv.mockReturnValueOnce(processEnv)
    mockedCreateProcess.mockResolvedValueOnce({
      stdout: 'done'
    } as unknown as Process)
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

    expect(mockedCreateProcess).toBeCalledWith({
      args,
      cwd,
      env: { ...processEnv, DVC_NO_ANALYTICS: 'true' },
      executable: 'dvc'
    })
  })

  it('should handle an error produced by the underlying process', async () => {
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
    const pythonBinPath = '/some/path/to/python'
    const SECRET_KEY = 'abc123'
    const processEnv = { PATH: existingPath, SECRET_KEY }
    const cwd = __dirname
    const args = [Command.CHECKOUT]
    mockedGetEnv.mockReturnValueOnce(processEnv)
    mockedCreateProcess.mockRejectedValueOnce({ stderr: 'I DEED' })
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

    expect(mockedCreateProcess).toBeCalledWith({
      args,
      cwd,
      env: {
        DVC_NO_ANALYTICS: 'true',
        PATH: `/some/path/to:${existingPath}`,
        SECRET_KEY
      },
      executable: '/some/path/to/dvc'
    })
  })
})
