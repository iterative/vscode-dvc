import { experimentShow, root, listDvcOnlyRecursive } from './reader'
import { executeProcess } from '../processExecution'
import { getProcessEnv } from '../env'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { join, resolve } from 'path'
import { mocked } from 'ts-jest/utils'

jest.mock('fs')
jest.mock('../processExecution')
jest.mock('../env')

const mockedExecuteProcess = mocked(executeProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/all/of/the/goodies:/in/my/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('experimentShow', () => {
  it('should match a snapshot when parsed', async () => {
    const cwd = resolve()
    mockedExecuteProcess.mockResolvedValueOnce(
      JSON.stringify(complexExperimentsOutput)
    )

    const experiments = await experimentShow({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })
    expect(experiments).toMatchSnapshot()
    expect(mockedExecuteProcess).toBeCalledWith({
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
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    const relativeRoot = await root({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(relativeRoot).toEqual(stdout)
    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['root'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('listDvcOnlyRecursive', () => {
  it('should return all relative tracked paths', async () => {
    const stdout = JSON.stringify([
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/t10k-images-idx3-ubyte'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/t10k-images-idx3-ubyte.gz'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/t10k-labels-idx1-ubyte'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/t10k-labels-idx1-ubyte.gz'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/train-images-idx3-ubyte'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/train-images-idx3-ubyte.gz'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/train-labels-idx1-ubyte'
      },
      {
        isout: false,
        isdir: false,
        isexec: false,
        path: 'data/MNIST/raw/train-labels-idx1-ubyte.gz'
      },
      { isout: false, isdir: false, isexec: false, path: 'logs/acc.tsv' },
      { isout: false, isdir: false, isexec: false, path: 'logs/loss.tsv' },
      { isout: true, isdir: false, isexec: false, path: 'model.pt' }
    ])
    const cwd = resolve()
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    const tracked = await listDvcOnlyRecursive({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })

    expect(tracked).toEqual(JSON.parse(stdout))

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['list', '.', '--dvc-only', '-R', '--show-json'],
      cwd,
      env: mockedEnv
    })
  })
})
