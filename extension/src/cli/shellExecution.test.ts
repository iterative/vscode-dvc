import { Commands } from './commands'
import { getCommand } from './shellExecution'
import { Config } from '../Config'
import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'

jest.mock('../env')

const mockedGetEnv = mocked(getProcessEnv)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getCommand', () => {
  it('should return the correct string given no path or execution details', () => {
    const existingPath = '/Users/robot/some/path:/Users/robot/yarn/path'
    const config = {
      dvcPath: ''
    } as Config
    mockedGetEnv.mockReturnValue({ PATH: existingPath })
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual(`PATH=${existingPath} dvc checkout`)
  })

  it('should return the correct string given a path to the cli but no execution details', () => {
    const existingPath = '/do/not/need/a/path'
    const dvcPath = '/some/path/to/dvc'
    const config = {
      dvcPath
    } as Config
    mockedGetEnv.mockReturnValue({ PATH: existingPath })
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual(`PATH=${existingPath} ${dvcPath} checkout`)
  })

  it('should return the correct string given a path to the cli and execution details', () => {
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
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual(
      `PATH=${pythonBinPath}:${existingPath} ${dvcPath} checkout`
    )
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
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual(`PATH=${pythonBinPath} ${dvcPath} checkout`)
  })
})
