import { Commands } from './commands'
import { getCommand } from './shellExecution'
import { Config } from '../Config'

describe('getCommand', () => {
  it('should return the correct string given no path or execution details', () => {
    const config = {
      dvcPath: ''
    } as Config
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual('PATH=$PATH dvc checkout')
  })

  it('should return the correct string given a path to the cli but no execution details', () => {
    const dvcPath = '/some/path/to/dvc'
    const config = {
      dvcPath
    } as Config
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual(`PATH=$PATH ${dvcPath} checkout`)
  })

  it('should return the correct string given a path to the cli and execution details', () => {
    const dvcPath = '/some/path/to/dvc'
    const pythonBinPath = '/some/conda/path/bin'
    const config = {
      dvcPath,
      pythonBinPath
    } as Config
    const command = getCommand(config, Commands.CHECKOUT)
    expect(command).toEqual(`PATH=${pythonBinPath}:$PATH ${dvcPath} checkout`)
  })
})
