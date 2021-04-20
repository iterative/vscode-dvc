import {
  checkout,
  checkoutRecursive,
  getExperiments,
  getRoot,
  initializeDirectory,
  listDvcOnlyRecursive
} from './reader'
import * as Util from '../util'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { join, resolve } from 'path'

jest.mock('fs')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getExperiments', () => {
  it('should match a snapshot when parsed', async () => {
    const cwd = resolve()
    const execPromiseSpy = jest
      .spyOn(Util, 'execPromise')
      .mockResolvedValueOnce({
        stdout: JSON.stringify(complexExperimentsOutput),
        stderr: ''
      })

    const experiments = await getExperiments({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })
    expect(experiments).toMatchSnapshot()
    expect(execPromiseSpy).toBeCalledWith(
      'dvc exp show --show-json',
      expect.objectContaining({
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

    const execPromiseSpy = jest
      .spyOn(Util, 'execPromise')
      .mockResolvedValueOnce({
        stdout,
        stderr: ''
      })

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout.trim())

    expect(execPromiseSpy).toBeCalledWith(
      'dvc init --subdir',
      expect.objectContaining({
        cwd: fsPath
      })
    )
  })
})
describe('checkout', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\nM       logs/\n`
    const execPromiseSpy = jest
      .spyOn(Util, 'execPromise')
      .mockResolvedValueOnce({
        stdout,
        stderr: ''
      })

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(['M       model.pt', 'M       logs/'])

    expect(execPromiseSpy).toBeCalledWith(
      'dvc checkout',
      expect.objectContaining({
        cwd: fsPath
      })
    )
  })
})

describe('checkoutRecursive', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\nM       logs/\n`
    const execPromiseSpy = jest
      .spyOn(Util, 'execPromise')
      .mockResolvedValueOnce({
        stdout,
        stderr: ''
      })

    const output = await checkoutRecursive({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(['M       model.pt', 'M       logs/'])

    expect(execPromiseSpy).toBeCalledWith(
      'dvc checkout --recursive',
      expect.objectContaining({
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
    const execPromiseSpy = jest
      .spyOn(Util, 'execPromise')
      .mockResolvedValueOnce({
        stdout: mockStdout,
        stderr: ''
      })
    const relativeRoot = await getRoot({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(relativeRoot).toEqual(mockRelativeRoot)
    expect(execPromiseSpy).toBeCalledWith(
      'dvc root',
      expect.objectContaining({
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
    const execPromiseSpy = jest
      .spyOn(Util, 'execPromise')
      .mockResolvedValueOnce({
        stdout: stdout,
        stderr: ''
      })
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

    expect(execPromiseSpy).toBeCalledWith(
      'dvc list . --dvc-only -R',
      expect.objectContaining({
        cwd
      })
    )
  })
})
