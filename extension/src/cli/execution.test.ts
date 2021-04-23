import { ChildProcess, spawn } from 'child_process'
import { Commands } from './commands'
import { executeNonBlocking } from './execution'
import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'

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

describe('executeNonBlocking', () => {
  it('should pass the correct details to spawn given no path to the cli or python binary path', async () => {
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
    const processEnv = { PATH: existingPath, SECRET_KEY: 'abc123' }
    const expectedCommand = `dvc ${Commands.CHECKOUT}`
    const cwd = __dirname
    mockedGetEnv.mockReturnValueOnce(processEnv)

    await executeNonBlocking({
      options: {
        command: Commands.CHECKOUT,
        cliPath: '',
        cwd,
        pythonBinPath: undefined
      }
    })

    expect(mockedSpawn).toBeCalledWith(expectedCommand, {
      cwd,
      env: processEnv
    })
  })

  it('should pass the correct details to spawn given a path to the cli but no python binary path', async () => {
    const existingPath = '/do/not/need/a/path'
    const processEnv = { PATH: existingPath }
    const cliPath = '/some/path/to/dvc'
    const cwd = __dirname
    mockedGetEnv.mockReturnValueOnce(processEnv)

    await executeNonBlocking({
      options: {
        command: Commands.CHECKOUT,
        cliPath,
        cwd,
        pythonBinPath: undefined
      }
    })

    expect(mockedSpawn).toBeCalledWith(`${cliPath} ${Commands.CHECKOUT}`, {
      cwd,
      env: processEnv
    })
  })

  it('should pass the correct details to spawn given a path to the cli, an existing PATH variable and a python binary path', async () => {
    const existingPath =
      '/var/folders/q_/jpcf1bld2vz9fs5n62mgqshc0000gq/T/yarn--1618526061412-0.878957498634626:' +
      '/Users/robot/PP/vscode-dvc/extension/node_modules/.bin:' +
      '/Users/robot/.config/yarn/link/node_modules/.bin:/Users/robot/.nvm/versions/node/v12.20.1/libexec/lib/node_modules/npm/bin/node-gyp-bin'
    mockedGetEnv.mockReturnValueOnce({ PATH: existingPath })

    const cliPath = '/some/path/to/dvc'
    const pythonBinPath = '/some/conda/path/bin'

    const cwd = __dirname

    await executeNonBlocking({
      options: {
        cliPath,
        command: Commands.CHECKOUT,
        cwd,
        pythonBinPath
      }
    })

    expect(mockedSpawn).toBeCalledWith(`${cliPath} ${Commands.CHECKOUT}`, {
      cwd,
      env: { PATH: `${pythonBinPath}:${existingPath}` }
    })
  })

  it('should pass a sane path to spawn if there is a python binary path but no existing PATH variable', async () => {
    const existingPath = ''
    mockedGetEnv.mockReturnValueOnce({ PATH: existingPath })

    const pythonBinPath = '/some/conda/path/bin'

    const cwd = __dirname

    await executeNonBlocking({
      options: {
        cliPath: undefined,
        command: Commands.CHECKOUT,
        cwd,
        pythonBinPath
      }
    })

    expect(mockedSpawn).toBeCalledWith(`dvc ${Commands.CHECKOUT}`, {
      cwd,
      env: { PATH: `${pythonBinPath}` }
    })
  })
})
