import { EventEmitter } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { Cli, CliResult } from '.'
import { Command } from './args'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import { Config } from '../config'

jest.mock('vscode')
jest.mock('../env')
jest.mock('../processExecution')

const mockedGetEnv = mocked(getProcessEnv)
const mockedExecuteProcess = mocked(executeProcess)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('executeProcess', () => {
  it('should pass the correct details to the underlying process given no path to the cli or python binary path', async () => {
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
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
      env: processEnv,
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
      env: { PATH: `${pythonBinPath}:${existingPath}`, SECRET_KEY },
      executable: '/some/path/to/dvc'
    })
  })
})
