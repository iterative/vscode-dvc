import { join } from 'path'
import { getOptions } from './options'
import { Command, Flag } from './args'

describe('getOptions', () => {
  const cwd = join('path', 'to', 'work', 'dir')

  it('should give the correct command string given a basic environment', () => {
    const options = getOptions(undefined, '', cwd, Command.CHECKOUT, Flag.FORCE)
    expect(options).toEqual({
      args: ['checkout', '-f'],
      command: 'dvc checkout -f',
      cwd,
      executable: 'dvc'
    })
  })

  it('should append -m dvc to the args if only an isolated python env is in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const options = getOptions(pythonBinPath, '', cwd, Command.DIFF)
    expect(options).toEqual({
      args: ['-m', 'dvc', 'diff'],
      command: `${pythonBinPath} -m dvc diff`,
      cwd,
      executable: pythonBinPath
    })
  })

  it('should not append -m dvc to the args args if both an isolated python env and direct path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const cliPath = join('custom', 'path', 'to', 'dvc')
    const options = getOptions(pythonBinPath, cliPath, cwd, Command.DIFF)
    expect(options).toEqual({
      args: ['diff'],
      command: `${cliPath} diff`,
      cwd,
      executable: cliPath
    })
  })
})
