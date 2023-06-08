import { join } from 'path'
import { getOptions } from './options'
import { Command, Flag } from './constants'
import { getProcessEnv } from '../../env'
import { joinEnvPath } from '../../util/env'

jest.mock('../../env')

const mockedPATH = '/some/special/path'

const mockedEnv = {
  DVCLIVE_OPEN: 'false',
  DVC_NO_ANALYTICS: 'true',
  GIT_TERMINAL_PROMPT: '0',
  PATH: mockedPATH
}
const mockedGetProcessEnv = jest.mocked(getProcessEnv)

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('getOptions', () => {
  const cwd = join('path', 'to', 'work', 'dir')

  it('should give the correct options given a basic environment', () => {
    const options = getOptions({
      PYTHONPATH: undefined,
      args: [Command.CHECKOUT, Flag.FORCE],
      cliPath: '',
      cwd,
      pythonBinPath: undefined
    })
    expect(options).toStrictEqual({
      args: ['checkout', '-f'],
      cwd,
      env: mockedEnv,
      executable: 'dvc'
    })
  })

  it('should append -m dvc to the args and use the python as the executable if only an isolated python env is in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const options = getOptions({
      PYTHONPATH: undefined,
      args: [Command.PULL],
      cliPath: '',
      cwd,
      pythonBinPath
    })
    expect(options).toStrictEqual({
      args: ['-m', 'dvc', 'pull'],
      cwd,
      env: {
        DVCLIVE_OPEN: 'false',
        DVC_NO_ANALYTICS: 'true',
        GIT_TERMINAL_PROMPT: '0',
        PATH: joinEnvPath(join('path', 'to', 'python', '.venv'), mockedPATH)
      },
      executable: pythonBinPath
    })
  })

  it('should append to the PATH but only use the path to the cli if both an isolated python env and path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const cliPath = join('custom', 'path', 'to', 'dvc')
    const options = getOptions({
      PYTHONPATH: undefined,
      args: [Command.PULL],
      cliPath,
      cwd,
      pythonBinPath
    })
    expect(options).toStrictEqual({
      args: ['pull'],
      cwd,
      env: {
        DVCLIVE_OPEN: 'false',
        DVC_NO_ANALYTICS: 'true',
        GIT_TERMINAL_PROMPT: '0',
        PATH: joinEnvPath(join('path', 'to', 'python', '.venv'), mockedPATH)
      },
      executable: cliPath
    })
  })

  it('should add PYTHONPATH to the environment variables if it is provided', () => {
    const PYTHONPATH = join('path', 'to', 'project')
    const venvPath = join(PYTHONPATH, '.venv')
    const pythonBinPath = join(venvPath, 'python')
    const cliPath = ''
    const options = getOptions({
      PYTHONPATH,
      args: [Command.PULL],
      cliPath,
      cwd,
      pythonBinPath
    })
    expect(options).toStrictEqual({
      args: ['-m', 'dvc', 'pull'],
      cwd,
      env: {
        DVCLIVE_OPEN: 'false',
        DVC_NO_ANALYTICS: 'true',
        GIT_TERMINAL_PROMPT: '0',
        PATH: joinEnvPath(venvPath, mockedPATH),
        PYTHONPATH
      },
      executable: pythonBinPath
    })
  })
})
