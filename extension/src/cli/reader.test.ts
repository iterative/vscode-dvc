import {
  checkout,
  commit,
  experimentApply,
  getExperiments,
  getRoot,
  initializeDirectory,
  listDvcOnlyRecursive
} from './reader'
import { runProcess } from '../processExecution'
import { getProcessEnv } from '../env'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { join, resolve } from 'path'
import { mocked } from 'ts-jest/utils'

jest.mock('fs')
jest.mock('../processExecution')
jest.mock('../env')

const mockedRunProcess = mocked(runProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/all/of/the/goodies:/in/my/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('getExperiments', () => {
  it('should match a snapshot when parsed', async () => {
    const cwd = resolve()
    mockedRunProcess.mockResolvedValueOnce(
      JSON.stringify(complexExperimentsOutput)
    )

    const experiments = await getExperiments({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })
    expect(experiments).toMatchSnapshot()
    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'show', '--show-json'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('initializeDirectory', () => {
  it('should call runProcess with the correct parameters', async () => {
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

    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['init', '--subdir'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})

describe('checkout', () => {
  it('should call runProcess with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\nM       logs/\n`
    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(['M       model.pt', 'M       logs/'])

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['checkout'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})

describe('commit', () => {
  it('should call execPromise with the correct parameters', async () => {
    const cwd = __dirname
    const stdout = "Updating lock file 'dvc.lock'"
    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await commit({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['commit', '-f'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('getRoot', () => {
  it('should return the root relative to the cwd', async () => {
    const stdout = join('..', '..')
    const cwd = resolve()
    mockedRunProcess.mockResolvedValueOnce(stdout)
    const relativeRoot = await getRoot({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(relativeRoot).toEqual(stdout)
    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['root'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('listDvcOnlyRecursive', () => {
  it('should return all relative tracked paths', async () => {
    const stdout =
      `data/MNIST/raw/t10k-images-idx3-ubyte\n` +
      `data/MNIST/raw/t10k-images-idx3-ubyte.gz\n` +
      `data/MNIST/raw/t10k-labels-idx1-ubyte\n` +
      `data/MNIST/raw/t10k-labels-idx1-ubyte.gz\n` +
      `data/MNIST/raw/train-images-idx3-ubyte\n` +
      `data/MNIST/raw/train-images-idx3-ubyte.gz\n` +
      `data/MNIST/raw/train-labels-idx1-ubyte\n` +
      `data/MNIST/raw/train-labels-idx1-ubyte.gz\n` +
      `logs/acc.tsv\n` +
      `logs/loss.tsv\n` +
      `model.pt`
    const cwd = resolve()
    mockedRunProcess.mockResolvedValueOnce(stdout)
    const tracked = await listDvcOnlyRecursive({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })

    expect(tracked).toEqual([
      'data/MNIST/raw/t10k-images-idx3-ubyte',
      'data/MNIST/raw/t10k-images-idx3-ubyte.gz',
      'data/MNIST/raw/t10k-labels-idx1-ubyte',
      'data/MNIST/raw/t10k-labels-idx1-ubyte.gz',
      'data/MNIST/raw/train-images-idx3-ubyte',
      'data/MNIST/raw/train-images-idx3-ubyte.gz',
      'data/MNIST/raw/train-labels-idx1-ubyte',
      'data/MNIST/raw/train-labels-idx1-ubyte.gz',
      'logs/acc.tsv',
      'logs/loss.tsv',
      'model.pt'
    ])

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['list', '.', '--dvc-only', '-R'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('experimentApply', () => {
  it('builds the correct command and returns stdout', async () => {
    const cwd = ''
    const stdout = 'Test output that will be passed along'
    mockedRunProcess.mockResolvedValueOnce(stdout)
    expect(
      await experimentApply(
        { cwd, cliPath: 'dvc', pythonBinPath: undefined },
        'exp-test'
      )
    ).toEqual(stdout)
    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'apply', 'exp-test'],
      cwd,
      env: mockedEnv
    })
  })
})
