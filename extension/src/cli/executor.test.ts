import { basename, resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import {
  addTarget,
  checkout,
  commit,
  experimentApply,
  initializeDirectory
} from './executor'

jest.mock('fs-extra')
jest.mock('../processExecution')
jest.mock('../env')

const mockedExecuteProcess = mocked(executeProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/some/special/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('add', () => {
  it('should call executeProcess with the correct parameters to add a file', async () => {
    const fsPath = __filename
    const dir = resolve(fsPath, '..')
    const file = basename(__filename)
    const stdout =
      `100% Add|████████████████████████████████████████████████` +
      `█████████████████████████████████████████████████████████` +
      `█████████████████████████████████████████████████████████` +
      `██████████████████████████████████████████|1/1 [00:00,  2` +
      `.20file/s]\n\r\n\rTo track the changes with git, run:\n\r` +
      `\n\rgit add ${file} .gitignore`

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await addTarget({
      cliPath: 'dvc',
      fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['add', file],
      cwd: dir,
      env: mockedEnv
    })
  })
})

describe('checkout', () => {
  it('should call executeProcess with the correct parameters to checkout a repo', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\nM       logs/\n`
    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['checkout'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})

describe('commit', () => {
  it('should call execPromise with the correct parameters to commit a repo', async () => {
    const cwd = __dirname
    const stdout = "Updating lock file 'dvc.lock'"
    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await commit({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['commit', '-f'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('experimentApply', () => {
  it('builds the correct command and returns stdout', async () => {
    const cwd = ''
    const stdout = 'Test output that will be passed along'
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    expect(
      await experimentApply(
        { cwd, cliPath: 'dvc', pythonBinPath: undefined },
        'exp-test'
      )
    ).toEqual(stdout)
    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'apply', 'exp-test'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('initializeDirectory', () => {
  it('should call executeProcess with the correct parameters to initialize a directory', async () => {
    const fsPath = __dirname
    const stdout = `
	  Initialized DVC repository.
	  You can now commit the changes to git.
	  
	  +---------------------------------------------------------------------+
	  |                                                                     |
	  |        DVC has enabled anonymous aggregate usage analytics.         |
	  |     Read the analytics documentation (and how to opt-out) here:     |
	  |             <https://dvc.org/doc/user-guide/analytics>              |
	  |                                                                     |
	  +---------------------------------------------------------------------+
	  
	  What's next?
	  ------------
	  - Check out the documentation: <https://dvc.org/doc>
	  - Get help and share ideas: <https://dvc.org/chat>
	  - Star us on GitHub: <https://github.com/iterative/dvc>`

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['init', '--subdir'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})
