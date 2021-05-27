import { EventEmitter } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { Command } from './args'
import { Cli } from '.'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import { Config } from '../Config'

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
      ({
        getCliPath: () => undefined,
        pythonBinPath: undefined
      } as unknown) as Config,
      ({ fire: jest.fn(), event: jest.fn() } as unknown) as EventEmitter<string>
    )

    await cli.executeProcess(cwd, ...args)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args,
      cwd,
      env: processEnv
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
      ({
        getCliPath: () => '/some/path/to/dvc',
        pythonBinPath
      } as unknown) as Config,
      ({ fire: jest.fn(), event: jest.fn() } as unknown) as EventEmitter<string>
    )

    await expect(cli.executeProcess(cwd, ...args)).rejects.toThrow()

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: '/some/path/to/dvc',
      args,
      cwd,
      env: { PATH: `${pythonBinPath}:${existingPath}`, SECRET_KEY }
    })
  })
})
