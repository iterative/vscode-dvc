import { Commands } from './commands'
import { getExecutionDetails } from './shellExecution'
import { Config } from '../Config'
import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'

jest.mock('../env')

const mockedGetEnv = mocked(getProcessEnv)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getExecutionDetails', () => {
  it('should return the correct execution details given no path or python binary path', () => {
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
    const processEnv = { PATH: existingPath, SECRET_KEY: 'abc123' }
    const config = {
      dvcPath: ''
    } as Config
    mockedGetEnv.mockReturnValue(processEnv)
    const expectedCommand = `dvc ${Commands.CHECKOUT}`
    const command = getExecutionDetails(config, Commands.CHECKOUT)
    expect(command).toEqual({
      executionCommand: expectedCommand,
      outputCommand: expectedCommand,
      env: processEnv
    })
  })

  it('should return the execution details given a path to the cli but no python binary path', () => {
    const existingPath = '/do/not/need/a/path'
    const dvcPath = '/some/path/to/dvc'
    const config = {
      dvcPath
    } as Config
    mockedGetEnv.mockReturnValue({ PATH: existingPath })
    const command = getExecutionDetails(config, Commands.CHECKOUT)
    expect(command).toEqual({
      executionCommand: `${dvcPath} ${Commands.CHECKOUT}`,
      outputCommand: `dvc ${Commands.CHECKOUT}`,
      env: { PATH: existingPath }
    })
  })

  it('should return the correct execution details given a path to the cli and a python binary path', () => {
    const existingPath =
      '/var/folders/q_/jpcf1bld2vz9fs5n62mgqshc0000gq/T/yarn--1618526061412-0.878957498634626:' +
      '/Users/robot/PP/vscode-dvc/extension/node_modules/.bin:' +
      '/Users/robot/.config/yarn/link/node_modules/.bin:/Users/robot/.nvm/versions/node/v12.20.1/libexec/lib/node_modules/npm/bin/node-gyp-bin'
    const dvcPath = '/some/path/to/dvc'
    const pythonBinPath = '/some/conda/path/bin'
    mockedGetEnv.mockReturnValue({ PATH: existingPath })
    const config = {
      dvcPath,
      pythonBinPath
    } as Config
    const command = getExecutionDetails(config, Commands.CHECKOUT)
    expect(command).toEqual({
      executionCommand: `${dvcPath} ${Commands.CHECKOUT}`,
      outputCommand: `dvc ${Commands.CHECKOUT}`,
      env: { PATH: `${pythonBinPath}:${existingPath}` }
    })
  })

  it('should return a sane path without an existing one if execution details are provided', () => {
    const existingPath = ''
    const dvcPath = '/some/path/to/dvc'
    const pythonBinPath = '/some/conda/path/bin'
    mockedGetEnv.mockReturnValue({ PATH: existingPath })
    const config = {
      dvcPath,
      pythonBinPath
    } as Config
    const command = getExecutionDetails(config, Commands.CHECKOUT)
    expect(command).toEqual({
      executionCommand: `${dvcPath} ${Commands.CHECKOUT}`,
      outputCommand: `dvc ${Commands.CHECKOUT}`,
      env: { PATH: `${pythonBinPath}` }
    })
  })
})
