import { Commands } from './commands'
import { ShellExecution } from './shellExecution'
import { Config } from '../Config'
import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'
import { ChildProcess, spawn } from 'child_process'

jest.mock('../env')
jest.mock('child_process')

const mockedGetEnv = mocked(getProcessEnv)
const mockedSpawn = mocked(spawn)

mockedSpawn.mockReturnValue(({
  on: jest.fn(),
  stderr: { on: jest.fn() },
  stdout: { on: jest.fn() }
} as unknown) as ChildProcess)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('run', () => {
  it('should pass the correct details to spawn given no path or python binary path', () => {
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
    const processEnv = { PATH: existingPath, SECRET_KEY: 'abc123' }
    const config = { dvcPath: '' } as Config
    const expectedCommand = `dvc ${Commands.CHECKOUT}`
    const cwd = __dirname
    mockedGetEnv.mockReturnValue(processEnv)

    const shellExecution = new ShellExecution(config)

    shellExecution.run(Commands.CHECKOUT, cwd)

    expect(mockedSpawn).toBeCalledWith(expectedCommand, {
      cwd,
      env: processEnv,
      shell: true
    })
  })

  it('should pass the correct details to spawn given a path to the cli but no python binary path', () => {
    const existingPath = '/do/not/need/a/path'
    const processEnv = { PATH: existingPath }
    const dvcPath = '/some/path/to/dvc'
    const config = { dvcPath } as Config
    const cwd = __dirname
    mockedGetEnv.mockReturnValue(processEnv)

    const shellExecution = new ShellExecution(config)

    shellExecution.run(Commands.CHECKOUT, cwd)

    expect(mockedSpawn).toBeCalledWith(`${dvcPath} ${Commands.CHECKOUT}`, {
      cwd,
      env: processEnv,
      shell: true
    })
  })

  it('should pass the correct details to spawn given a path to the cli and a python binary path', () => {
    const existingPath =
      '/var/folders/q_/jpcf1bld2vz9fs5n62mgqshc0000gq/T/yarn--1618526061412-0.878957498634626:' +
      '/Users/robot/PP/vscode-dvc/extension/node_modules/.bin:' +
      '/Users/robot/.config/yarn/link/node_modules/.bin:/Users/robot/.nvm/versions/node/v12.20.1/libexec/lib/node_modules/npm/bin/node-gyp-bin'
    mockedGetEnv.mockReturnValue({ PATH: existingPath })

    const dvcPath = '/some/path/to/dvc'
    const pythonBinPath = '/some/conda/path/bin'
    const config = { dvcPath, pythonBinPath } as Config

    const cwd = __dirname

    const shellExecution = new ShellExecution(config)

    shellExecution.run(Commands.CHECKOUT, cwd)

    expect(mockedSpawn).toBeCalledWith(`${dvcPath} ${Commands.CHECKOUT}`, {
      cwd,
      env: { PATH: `${pythonBinPath}:${existingPath}` },
      shell: true
    })
  })

  it('should pass a sane path to spawn without if there is a python binary path but no existing PATH variable', () => {
    const existingPath = ''
    mockedGetEnv.mockReturnValue({ PATH: existingPath })

    const pythonBinPath = '/some/conda/path/bin'
    const config = {
      pythonBinPath
    } as Config
    const shellExecution = new ShellExecution(config)

    const cwd = __dirname
    shellExecution.run(Commands.CHECKOUT, cwd)

    expect(mockedSpawn).toBeCalledWith(`dvc ${Commands.CHECKOUT}`, {
      cwd,
      env: { PATH: `${pythonBinPath}` },
      shell: true
    })
  })
})
