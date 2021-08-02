import { join } from 'path'
import { getArgs, getExecutable } from './command'
import { Command, Flag } from './args'

describe('getArgs', () => {
  it('should give the correct command string given a basic environment', () => {
    const args = getArgs(undefined, 'dvc', Command.CHECKOUT, Flag.FORCE)
    expect(args).toEqual(['checkout', '-f'])
  })

  it('should append -m dvc to the args if only an isolated python env is in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const commandString = getArgs(pythonBinPath, '', Command.DIFF)
    expect(commandString).toEqual(['-m', 'dvc', 'diff'])
  })

  it('should not append -m dvc to the args args if both an isolated python env and direct path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const commandString = getArgs(pythonBinPath, 'dvc', Command.DIFF)
    expect(commandString).toEqual(['diff'])
  })
})

describe('getExecutable', () => {
  it('should return the path to the cli if both an isolated python env and direct path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'conda', '.venv', 'python')
    const cliPath = join('custom', 'path', 'to', 'dvc')
    const executable = getExecutable(pythonBinPath, cliPath)
    expect(executable).toEqual(cliPath)
  })

  it('should return the path to python if only an isolated python env is in use', () => {
    const pythonBinPath = join('path', 'to', 'conda', '.venv', 'python')
    const cliPath = ''
    const executable = getExecutable(pythonBinPath, cliPath)
    expect(executable).toEqual(pythonBinPath)
  })

  it('should return dvc as a default', () => {
    const pythonBinPath = undefined
    const cliPath = ''
    const executable = getExecutable(pythonBinPath, cliPath)
    expect(executable).toEqual('dvc')
  })
})
