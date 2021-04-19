import { Disposable } from '@hediet/std/disposable'
import { join, resolve } from 'path'
import { Config } from './Config'
import { SourceControlManagement } from './views/SourceControlManagement'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository, RepositoryState } from './Repository'
import { listDvcOnlyRecursive, status } from './cli/reader'
import { getAllUntracked } from './git'

jest.mock('@hediet/std/disposable')
jest.mock('./views/SourceControlManagement')
jest.mock('./DecorationProvider')
jest.mock('./cli/reader')
jest.mock('./git')

const mockedListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)
const mockedStatus = mocked(status)
const mockedGetAllUntracked = mocked(getAllUntracked)

const mockedSourceControlManagement = mocked(SourceControlManagement)
const mockedSetScmState = jest.fn()
mockedSourceControlManagement.mockImplementation(function() {
  return ({
    setState: mockedSetScmState
  } as unknown) as SourceControlManagement
})

const mockedDecorationProvider = mocked(DecorationProvider)
const mockedSetDecorationState = jest.fn()
mockedDecorationProvider.mockImplementation(function() {
  return ({
    setState: mockedSetDecorationState
  } as unknown) as DecorationProvider
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Repository', () => {
  const dvcRoot = resolve(__dirname, '..', '..', 'demo')

  describe('ready', () => {
    it('should wait for the state to be ready before resolving', async () => {
      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const MNISTDataDir = join('data', 'MNIST')
      const rawDataDir = join(MNISTDataDir, 'raw')
      const model = 'model.pt'
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        logAcc,
        logLoss,
        model,
        rawDataDir
      ])

      mockedStatus.mockResolvedValueOnce({
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
          'always changed'
        ],
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as Record<string, (Record<string, Record<string, string>> | string)[]>)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      const config = ({
        dvcPath: undefined
      } as unknown) as Config
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(dvcRoot, config, decorationProvider)
      await repository.ready

      const modified = new Set([resolve(dvcRoot, rawDataDir)])
      const tracked = new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, rawDataDir),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, MNISTDataDir)
      ])
      const emptySet = new Set()

      expect(mockedStatus).toBeCalledWith(config, dvcRoot)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith({
        cwd: dvcRoot,
        cliPath: undefined
      })

      expect(repository.getState()).toEqual({
        dispose: Disposable.fn(),
        deleted: emptySet,
        notInCache: emptySet,
        new: emptySet,
        modified,
        tracked,
        untracked
      })
    })
  })

  describe('updateState', () => {
    it("should update the classes state and call it's dependents", async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(new Set())

      const config = ({
        dvcPath: undefined
      } as unknown) as Config
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(dvcRoot, config, decorationProvider)

      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const dataDir = 'data'
      const model = 'model.pt'
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        logAcc,
        logLoss,
        model,
        dataDir
      ])

      mockedStatus.mockResolvedValueOnce({
        prepare: [
          { 'changed deps': { 'data/data.xml': 'not in cache' } },
          { 'changed outs': { 'data/prepared': 'not in cache' } }
        ],
        featurize: [
          { 'changed deps': { 'data/prepared': 'not in cache' } },
          { 'changed outs': { 'data/features': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/features': 'modified' } },
          { 'changed outs': { 'model.pkl': 'deleted' } }
        ],
        evaluate: [
          {
            'changed deps': {
              'data/features': 'modified',
              'model.pkl': 'deleted'
            }
          }
        ],
        'data/data.xml.dvc': [
          { 'changed outs': { 'data/data.xml': 'not in cache' } }
        ]
      } as Record<string, (Record<string, Record<string, string>> | string)[]>)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py'),
        resolve(dvcRoot, 'some', 'untracked', 'go.go'),
        resolve(dvcRoot, 'some', 'untracked', 'perl.pl')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      expect(repository.getState()).toEqual(new RepositoryState())

      await repository.updateState()

      const deleted = new Set([join(dvcRoot, 'model.pkl')])
      const modified = new Set([join(dvcRoot, 'data/features')])
      const notInCache = new Set([
        join(dvcRoot, 'data/data.xml'),
        join(dvcRoot, 'data/prepared')
      ])
      const tracked = new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, dataDir),
        resolve(dvcRoot, logDir)
      ])

      expect(mockedStatus).toBeCalledWith(config, dvcRoot)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith({
        cwd: dvcRoot,
        cliPath: undefined
      })

      expect(repository.getState()).toEqual({
        dispose: Disposable.fn(),
        new: new Set(),
        modified,
        notInCache,
        deleted,
        tracked,
        untracked
      })

      expect(mockedSetDecorationState).toHaveBeenLastCalledWith(
        repository.getState()
      )
      expect(mockedSetScmState).toHaveBeenLastCalledWith(repository.getState())
    })
  })
})
