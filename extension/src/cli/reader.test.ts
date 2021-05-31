import { CliReader } from './reader'
import { executeProcess } from '../processExecution'
import { getProcessEnv } from '../env'
import complexExperimentsOutput from '../experiments/webview/complex-output-example.json'
import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { Config } from '../Config'
import { EventEmitter } from 'vscode'
import { CliResult } from '.'

jest.mock('vscode')
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

describe('CliReader', () => {
  const cliReader = new CliReader(
    ({
      getCliPath: () => undefined,
      pythonBinPath: undefined
    } as unknown) as Config,
    ({
      fire: jest.fn(),
      event: jest.fn()
    } as unknown) as EventEmitter<CliResult>
  )

  describe('experimentListCurrent', () => {
    it('should call the cli with the correct parameters to list all current experiments', async () => {
      const cwd = __dirname
      const experimentNames = ['exp-0180a', 'exp-c5444', 'exp-054c1']
      mockedExecuteProcess.mockResolvedValueOnce(experimentNames.join('\n'))

      const experimentList = await cliReader.experimentListCurrent(cwd)
      expect(experimentList).toEqual(experimentNames)
      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['exp', 'list', '--names-only'],
        cwd,
        env: mockedEnv
      })
    })
  })

  describe('experimentShow', () => {
    it('should match a snapshot when parsed', async () => {
      const cwd = __dirname
      mockedExecuteProcess.mockResolvedValueOnce(
        JSON.stringify(complexExperimentsOutput)
      )

      const experiments = await cliReader.experimentShow(cwd)
      expect(experiments).toMatchSnapshot()
      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['exp', 'show', SHOW_JSON],
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
      const statusOutput = await cliReader.diff(cwd)

      expect(statusOutput).toEqual(cliOutput)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['diff', SHOW_JSON],
        cwd,
        env: mockedEnv
      })
    })
  })

  describe('listDvcOnly', () => {
    it('should return all relative tracked paths for a single directory', async () => {
      const cwd = __dirname
      const path = 'logs'
      const listOutput = [
        { isout: false, isdir: false, isexec: false, path: 'acc.tsv' },
        { isout: false, isdir: false, isexec: false, path: 'loss.tsv' }
      ]
      mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(listOutput))
      const tracked = await cliReader.listDvcOnly(cwd, path)

      expect(tracked).toEqual(listOutput)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['list', '.', path, '--dvc-only', '--show-json'],
        cwd,
        env: mockedEnv
      })
    })

    describe('listDvcOnlyRecursive', () => {
      it('should return all relative tracked paths', async () => {
        const cwd = __dirname
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
        mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(listOutput))
        const tracked = await cliReader.listDvcOnlyRecursive(cwd)

        expect(tracked).toEqual(listOutput)

        expect(mockedExecuteProcess).toBeCalledWith({
          executable: 'dvc',
          args: ['list', '.', '--dvc-only', '-R', SHOW_JSON],
          cwd,
          env: mockedEnv
        })
      })

      describe('root', () => {
        it('should return the root relative to the cwd', async () => {
          const stdout = join('..', '..')
          const cwd = __dirname
          mockedExecuteProcess.mockResolvedValueOnce(stdout)
          const relativeRoot = await cliReader.root(cwd)
          expect(relativeRoot).toEqual(stdout)
          expect(mockedExecuteProcess).toBeCalledWith({
            executable: 'dvc',
            args: ['root'],
            cwd,
            env: mockedEnv
          })
        })

        it('should return undefined when run outside of a project', async () => {
          const cwd = __dirname
          mockedExecuteProcess.mockRejectedValueOnce({
            stderr:
              "ERROR: you are not inside of a DVC repository (checked up to mount point '/' )"
          })
          const relativeRoot = await cliReader.root(cwd)
          expect(relativeRoot).toBeUndefined()
          expect(mockedExecuteProcess).toBeCalledWith({
            executable: 'dvc',
            args: ['root'],
            cwd,
            env: mockedEnv
          })
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
        const diffOutput = await cliReader.status(cwd)

        expect(diffOutput).toEqual(cliOutput)

        expect(mockedExecuteProcess).toBeCalledWith({
          executable: 'dvc',
          args: ['status', SHOW_JSON],
          cwd,
          env: mockedEnv
        })
      })
    })
  })
})
