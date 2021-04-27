import {
  checkout,
  experimentApply,
  getExperiments,
  getRoot,
  initializeDirectory,
  listDvcOnlyRecursive
} from './reader'
import { runProcess } from '../processExecution'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { join, resolve } from 'path'
import { mocked } from 'ts-jest/utils'

jest.mock('fs')

beforeEach(() => {
  jest.resetAllMocks()
})

jest.mock('../processExecution')

const mockedRunProcess = mocked(runProcess)

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
    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['exp show --show-json'],
        cwd
      })
    )
  })
})

describe('initializeDirectory', () => {
  it('should call execPromise with the correct parameters', async () => {
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
	- Star us on GitHub: <https://github.com/iterative/dvc>
	`

    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout.trim())

    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['init --subdir'],
        cwd: fsPath
      })
    )
  })
})
describe('checkout', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\nM       logs/\n`
    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(['M       model.pt', 'M       logs/'])

    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['checkout'],
        cwd: fsPath
      })
    )
  })
})

describe('getRoot', () => {
  it('should return the root relative to the cwd', async () => {
    const mockRelativeRoot = join('..', '..')
    const mockStdout = mockRelativeRoot + '\n\r'
    const cwd = resolve()
    mockedRunProcess.mockResolvedValueOnce(mockStdout)
    const relativeRoot = await getRoot({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(relativeRoot).toEqual(mockRelativeRoot)
    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['root'],
        cwd
      })
    )
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

    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['list .', '--dvc-only', '-R'],
        cwd
      })
    )
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
    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['exp', 'apply', 'exp-test'],
        cwd
      })
    )
  })
})
