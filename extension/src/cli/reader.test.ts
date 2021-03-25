import { mocked } from 'ts-jest/utils'
import {
  getExperiments,
  checkout,
  initializeDirectory,
  checkoutRecursive,
  getRoot,
  listDvcOnlyRecursive
} from './reader'
import { execPromise } from '../util'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { join, resolve } from 'path'

jest.mock('fs')
jest.mock('../util')

const mockedExecPromise = mocked(execPromise)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getExperiments', () => {
  it('should match a snapshot when parsed', async () => {
    const cwd = resolve()
    mockedExecPromise.mockResolvedValueOnce({
      stdout: JSON.stringify(complexExperimentsOutput),
      stderr: ''
    })

    const experiments = await getExperiments({
      cliPath: 'dvc',
      cwd
    })
    expect(experiments).toMatchSnapshot()
    expect(mockedExecPromise).toBeCalledWith('dvc exp show --show-json', {
      cwd
    })
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

    mockedExecPromise.mockResolvedValueOnce({
      stdout,
      stderr: ''
    })

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith('dvc init --subdir', {
      cwd: fsPath
    })
  })
})
describe('checkout', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\n\rM       logs/\n\r`
    mockedExecPromise.mockResolvedValueOnce({
      stdout,
      stderr: ''
    })

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith('dvc checkout', {
      cwd: fsPath
    })
  })
})

describe('checkoutRecursive', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\n\rM       logs/\n\r`
    mockedExecPromise.mockResolvedValueOnce({
      stdout,
      stderr: ''
    })

    const output = await checkoutRecursive({
      cliPath: 'dvc',
      cwd: fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith('dvc checkout --recursive', {
      cwd: fsPath
    })
  })
})

describe('getRoot', () => {
  it('should return the root relative to the cwd', async () => {
    const mockRelativeRoot = join('..', '..')
    const mockStdout = mockRelativeRoot + '\n\r'
    const cwd = resolve()
    mockedExecPromise.mockResolvedValueOnce({
      stdout: mockStdout,
      stderr: ''
    })
    const relativeRoot = await getRoot({
      cwd,
      cliPath: 'dvc'
    })
    expect(relativeRoot).toEqual(mockRelativeRoot)
    expect(mockedExecPromise).toBeCalledWith('dvc root', {
      cwd
    })
  })
})

describe('getTracked', () => {
  it('should return the root relative to the cwd', async () => {
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
    mockedExecPromise.mockResolvedValueOnce({
      stdout: stdout,
      stderr: ''
    })
    const tracked = await listDvcOnlyRecursive({
      cwd,
      cliPath: 'dvc'
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

    expect(mockedExecPromise).toBeCalledWith('dvc list . --dvc-only -R', {
      cwd
    })
  })
})
