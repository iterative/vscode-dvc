import { join } from 'path'
import { getCommandString } from './command'
import { Command, Flag } from './constants'

describe('getCommandString', () => {
  it('should give the correct command string given a basic environment', () => {
    const commandString = getCommandString(
      undefined,
      'dvc',
      Command.CHECKOUT,
      Flag.FORCE
    )
    expect(commandString).toStrictEqual('dvc checkout -f')
  })

  it('should give the correct command string given an isolated python env is in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv')
    const commandString = getCommandString(pythonBinPath, 'dvc', Command.PULL)
    expect(commandString).toStrictEqual(
      `${join(pythonBinPath, 'python')} dvc pull`
    )
  })

  it('should give the correct command string given both an isolated python env and direct path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'conda', '.venv')
    const cliPath = join('custom', 'path', 'to', 'dvc')
    const commandString = getCommandString(pythonBinPath, cliPath, Command.PUSH)
    expect(commandString).toStrictEqual(
      `${join(pythonBinPath, 'python')} ${cliPath} push`
    )
  })
})
