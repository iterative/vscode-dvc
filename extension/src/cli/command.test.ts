import { join } from 'path'
import { getCommandString } from './command'
import { Command, Flag } from './args'

describe('getCommandString', () => {
  it('should give the correct command string given a basic environment', () => {
    const commandString = getCommandString(
      undefined,
      'dvc',
      Command.CHECKOUT,
      Flag.FORCE
    )
    expect(commandString).toEqual('dvc checkout -f')
  })

  it('should give the correct command string if only an isolated python env is in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const commandString = getCommandString(pythonBinPath, '', Command.DIFF)
    expect(commandString).toEqual(`${pythonBinPath} -m dvc diff`)
  })

  it('should return only the path to the cli if both an isolated python env and direct path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'conda', '.venv', 'python')
    const cliPath = join('custom', 'path', 'to', 'dvc')
    const commandString = getCommandString(pythonBinPath, cliPath, Command.PUSH)
    expect(commandString).toEqual(`${cliPath} push`)
  })
})
