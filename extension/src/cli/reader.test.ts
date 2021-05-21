import {
  diff,
  experimentShow,
  listDvcOnlyRecursive,
  root,
  status
} from './reader'
import { executeProcess } from '../processExecution'
import { getProcessEnv } from '../env'
import complexExperimentsOutput from '../Experiments/Webview/complex-output-example.json'
import { join } from 'path'
import { mocked } from 'ts-jest/utils'

jest.mock('fs')
jest.mock('../processExecution')
jest.mock('../env')

const mockedExecuteProcess = mocked(executeProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/all/of/the/goodies:/in/my/path'
}
const SHOW_JSON = '--show-json'

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('experimentShow', () => {
  it('should match a snapshot when parsed', async () => {
    const cwd = __dirname
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
      args: ['exp', 'show', SHOW_JSON],
      cwd,
      env: mockedEnv
    })
  })
})

describe('root', () => {
  it('should return the root relative to the cwd', async () => {
    const stdout = join('..', '..')
    const cwd = __dirname
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
    const listOutput = [
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
    ]
    const cwd = __dirname
    mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(listOutput))
    const tracked = await listDvcOnlyRecursive({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })

    expect(tracked).toEqual(listOutput)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['list', '.', '--dvc-only', '-R', SHOW_JSON],
      cwd,
      env: mockedEnv
    })
  })
})

describe('diff', () => {
  it('should call the cli with the correct parameters', async () => {
    const cliOutput = {
      added: [],
      deleted: [{ path: 'data/MNIST/raw/t10k-images-idx3-ubyte' }],
      modified: [
        { path: 'data/MNIST/raw/' },
        { path: 'logs/' },
        { path: 'logs/acc.tsv' },
        { path: 'logs/loss.tsv' },
        { path: 'model.pt' },
        { path: 'predictions.json' }
      ],
      renamed: [],
      'not in cache': []
    }
    const cwd = __dirname
    mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(cliOutput))
    const statusOutput = await diff({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })

    expect(statusOutput).toEqual(cliOutput)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['diff', SHOW_JSON],
      cwd,
      env: mockedEnv
    })
  })
})

describe('status', () => {
  it('should call the cli with the correct parameters', async () => {
    const cliOutput = {
      train: [
        { 'changed deps': { 'data/MNIST': 'modified' } },
        { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
        'always changed'
      ],
      'data/MNIST/raw.dvc': [
        { 'changed outs': { 'data/MNIST/raw': 'modified' } }
      ]
    }
    const cwd = __dirname
    mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(cliOutput))
    const diffOutput = await status({
      cliPath: undefined,
      pythonBinPath: undefined,
      cwd
    })

    expect(diffOutput).toEqual(cliOutput)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['status', SHOW_JSON],
      cwd,
      env: mockedEnv
    })
  })
})
