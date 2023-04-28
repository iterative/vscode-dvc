import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { DvcCli } from '.'
import { Command } from './constants'
import { CliResult, CliStarted, typeCheckCommands } from '..'
import { getProcessEnv } from '../../env'
import { createProcess } from '../../process/execution'
import { getFailingMockedProcess, getMockedProcess } from '../../test/util/jest'
import { Config } from '../../config'
import { joinEnvPath } from '../../util/env'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../env')
jest.mock('../../process/execution')

const mockedDisposable = jest.mocked(Disposable)

const mockedGetEnv = jest.mocked(getProcessEnv)
const mockedCreateProcess = jest.mocked(createProcess)

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
  const cli = { func: jest.fn() } as unknown as DvcCli
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
    expect(commandsToAutoRegister).toStrictEqual(['func'])
  })
})

describe('executeDvcProcess', () => {
  it('should pass the correct details to the underlying process given no path to the cli or python binary path', async () => {
    const existingPath = joinEnvPath(
      '/Users/robot/some/path',
      '/Users/robot/yarn/path'
    )
    const processEnv = { PATH: existingPath, SECRET_KEY: 'abc123' }
    const cwd = __dirname
    const args = [Command.CHECKOUT]
    mockedGetEnv.mockReturnValueOnce(processEnv)
    mockedCreateProcess.mockReturnValueOnce(getMockedProcess('done'))
    const cli = new DvcCli(
      {
        getCliPath: () => undefined,
        getPythonBinPath: () => undefined
      } as unknown as Config,
      {
        processCompleted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<CliResult>,
        processStarted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<CliStarted>
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).executeDvcProcess(cwd, ...args)

    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args,
      cwd,
      env: { ...processEnv, DVCLIVE_OPEN: 'false', DVC_NO_ANALYTICS: 'true' },
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
    mockedCreateProcess.mockReturnValueOnce(getFailingMockedProcess('I DEED'))
    const cli = new DvcCli(
      {
        getCliPath: () => '/some/path/to/dvc',
        getPythonBinPath: () => pythonBinPath
      } as unknown as Config,
      {
        processCompleted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<CliResult>,
        processStarted: {
          event: jest.fn(),
          fire: jest.fn()
        } as unknown as EventEmitter<CliStarted>
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((cli as any).executeDvcProcess(cwd, ...args)).rejects.toThrow()

    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args,
      cwd,
      env: {
        DVCLIVE_OPEN: 'false',
        DVC_NO_ANALYTICS: 'true',
        PATH: joinEnvPath('/some/path/to', existingPath),
        SECRET_KEY
      },
      executable: '/some/path/to/dvc'
    })
  })
})
