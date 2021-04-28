import { getExperiments, root, listDvcOnlyRecursive } from './reader'
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

describe('root', () => {
  it('should return the root relative to the cwd', async () => {
    const stdout = join('..', '..')
    const cwd = resolve()
    mockedRunProcess.mockResolvedValueOnce(stdout)
    const relativeRoot = await root({
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
