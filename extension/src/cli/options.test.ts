import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { getOptions } from './options'
import { Command, Flag } from './args'
import { getProcessEnv } from '../env'

jest.mock('../env')

const mockedPATH = '/some/special/path'

const mockedEnv = {
  PATH: mockedPATH
}
const mockedGetProcessEnv = mocked(getProcessEnv)

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('getOptions', () => {
  const cwd = join('path', 'to', 'work', 'dir')

  it('should give the correct options given a basic environment', () => {
    const options = getOptions(undefined, '', cwd, Command.CHECKOUT, Flag.FORCE)
    expect(options).toEqual({
      args: ['checkout', '-f'],
      command: 'dvc checkout -f',
      cwd,
      env: mockedEnv,
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
      env: { PATH: `${join('path', 'to', 'python', '.venv')}:${mockedPATH}` },
      executable: pythonBinPath
    })
  })

  it('should only use the path to the cli if both an isolated python env and path to dvc are in use', () => {
    const pythonBinPath = join('path', 'to', 'python', '.venv', 'python')
    const cliPath = join('custom', 'path', 'to', 'dvc')
    const options = getOptions(pythonBinPath, cliPath, cwd, Command.DIFF)
    expect(options).toEqual({
      args: ['diff'],
      command: `${cliPath} diff`,
      cwd,
      env: { PATH: `${join('path', 'to', 'python', '.venv')}:${mockedPATH}` },
      executable: cliPath
    })
  })
})
