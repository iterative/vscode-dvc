import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'vscode'
import complexExperimentsOutput from 'fixtures/expShow/complex.json'
import { CliResult } from '.'
import { CliReader } from './reader'
import { executeProcess } from '../processExecution'
import { getProcessEnv } from '../env'
import { Config } from '../config'

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
    {
      processCompleted: ({
        event: jest.fn(),
        fire: jest.fn()
      } as unknown) as EventEmitter<CliResult>,
      processStarted: ({
        event: jest.fn(),
        fire: jest.fn()
      } as unknown) as EventEmitter<void>
    }
  )

  describe('experimentListCurrent', () => {
    it('should call the cli with the correct parameters to list all current experiments', async () => {
      const cwd = __dirname
      const experimentNames = ['exp-0180a', 'exp-c5444', 'exp-054c1']
      mockedExecuteProcess.mockResolvedValueOnce(experimentNames.join('\n'))

      const experimentList = await cliReader.experimentListCurrent(cwd)
      expect(experimentList).toEqual(experimentNames)
      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['exp', 'list', '--names-only'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
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
        args: ['exp', 'show', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
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
        'not in cache': [],
        renamed: []
      }
      const cwd = __dirname
      mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(cliOutput))
      const statusOutput = await cliReader.diff(cwd)

      expect(statusOutput).toEqual(cliOutput)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['diff', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('listDvcOnly', () => {
    it('should return all relative tracked paths for a single directory', async () => {
      const cwd = __dirname
      const path = 'logs'
      const listOutput = [
        { isdir: false, isexec: false, isout: false, path: 'acc.tsv' },
        { isdir: false, isexec: false, isout: false, path: 'loss.tsv' }
      ]
      mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(listOutput))
      const tracked = await cliReader.listDvcOnly(cwd, path)

      expect(tracked).toEqual(listOutput)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['list', '.', path, '--dvc-only', '--show-json'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    describe('listDvcOnlyRecursive', () => {
      it('should return all relative tracked paths', async () => {
        const cwd = __dirname
        const listOutput = [
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/t10k-images-idx3-ubyte'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/t10k-images-idx3-ubyte.gz'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/t10k-labels-idx1-ubyte'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/t10k-labels-idx1-ubyte.gz'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/train-images-idx3-ubyte'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/train-images-idx3-ubyte.gz'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/train-labels-idx1-ubyte'
          },
          {
            isdir: false,
            isexec: false,
            isout: false,
            path: 'data/MNIST/raw/train-labels-idx1-ubyte.gz'
          },
          { isdir: false, isexec: false, isout: false, path: 'logs/acc.tsv' },
          { isdir: false, isexec: false, isout: false, path: 'logs/loss.tsv' },
          { isdir: false, isexec: false, isout: true, path: 'model.pt' }
        ]
        mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(listOutput))
        const tracked = await cliReader.listDvcOnlyRecursive(cwd)

        expect(tracked).toEqual(listOutput)

        expect(mockedExecuteProcess).toBeCalledWith({
          args: ['list', '.', '--dvc-only', '-R', SHOW_JSON],
          cwd,
          env: mockedEnv,
          executable: 'dvc'
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
            args: ['root'],
            cwd,
            env: mockedEnv,
            executable: 'dvc'
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
            args: ['root'],
            cwd,
            env: mockedEnv,
            executable: 'dvc'
          })
        })
      })
    })

    describe('status', () => {
      it('should call the cli with the correct parameters', async () => {
        const cliOutput = {
          'data/MNIST/raw.dvc': [
            { 'changed outs': { 'data/MNIST/raw': 'modified' } }
          ],
          train: [
            { 'changed deps': { 'data/MNIST': 'modified' } },
            { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
            'always changed'
          ]
        }
        const cwd = __dirname
        mockedExecuteProcess.mockResolvedValueOnce(JSON.stringify(cliOutput))
        const diffOutput = await cliReader.status(cwd)

        expect(diffOutput).toEqual(cliOutput)

        expect(mockedExecuteProcess).toBeCalledWith({
          args: ['status', SHOW_JSON],
          cwd,
          env: mockedEnv,
          executable: 'dvc'
        })
      })
    })
  })
})
