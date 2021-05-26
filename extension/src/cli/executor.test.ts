import { basename, join, resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import {
  addTarget,
  checkout,
  checkoutTarget,
  commit,
  experimentApply,
  init,
  pull,
  push,
  removeTarget
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

describe('addTarget', () => {
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
      args: ['checkout', '-f'],
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

describe('init', () => {
  it('should call executeProcess with the correct parameters to initialize a project', async () => {
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

    const output = await init({
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

describe('pull', () => {
  it('should call executeProcess with the correct parameters to pull the entire repository', async () => {
    const cwd = __dirname
    const stdout = 'M       data/MNIST/raw/\n1 file modified'

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await pull({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['pull'],
      cwd: __dirname,
      env: mockedEnv
    })
  })
})

describe('push', () => {
  it('should call executeProcess with the correct parameters to push the entire repository', async () => {
    const cwd = __dirname
    const stdout = 'Everything is up to date.'

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await push({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['push'],
      cwd: __dirname,
      env: mockedEnv
    })
  })
})

describe('checkoutTarget', () => {
  it('should call executeProcess with the correct parameters to checkout a file', async () => {
    const file = 'acc.tsv'
    const dir = join(__dirname, 'logs')
    const fsPath = join(dir, 'acc.tsv')

    const stdout = 'M       ./'

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await checkoutTarget({
      cliPath: 'dvc',
      fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['checkout', '-f', file],
      cwd: dir,
      env: mockedEnv
    })
  })
})

describe('removeTarget', () => {
  it('should call executeProcess with the correct parameters to remove a .dvc file', async () => {
    const file = 'data.dvc'
    const fsPath = join(__dirname, 'data.dvc')

    const stdout = ''

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await removeTarget({
      cliPath: 'dvc',
      fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['remove', file],
      cwd: __dirname,
      env: mockedEnv
    })
  })
})
