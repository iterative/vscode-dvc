import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, resolve } from 'path'
import { Config } from '../Config'
import { SourceControlManagement } from './views/SourceControlManagement'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository } from '.'
import { RepositoryState } from './State'
import {
  listDvcOnlyRecursive,
  ListOutput,
  status,
  Status,
  StatusOutput
} from '../cli/reader'
import { getAllUntracked } from '../git'

jest.mock('@hediet/std/disposable')
jest.mock('./views/SourceControlManagement')
jest.mock('./DecorationProvider')
jest.mock('../cli/reader')
jest.mock('../git')
jest.mock('../fileSystem')

const mockedListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)
const mockedStatus = mocked(status)
const mockedGetAllUntracked = mocked(getAllUntracked)

const mockedSourceControlManagement = mocked(SourceControlManagement)
const mockedSetScmState = jest.fn()

const mockedDecorationProvider = mocked(DecorationProvider)
const mockedSetDecorationState = jest.fn()

const mockedDisposable = mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()

  mockedSourceControlManagement.mockImplementationOnce(function() {
    return ({
      setState: mockedSetScmState
    } as unknown) as SourceControlManagement
  })

  mockedDecorationProvider.mockImplementationOnce(function() {
    return ({
      setState: mockedSetDecorationState
    } as unknown) as DecorationProvider
  })

  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('Repository', () => {
  const dvcRoot = resolve(__dirname, '..', '..', 'demo')
  const emptyState = new RepositoryState(dvcRoot).getState()
  const emptySet = new Set<string>()

  describe('ready', () => {
    it('should wait for the state to be ready before resolving', async () => {
      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const MNISTDataDir = join('data', 'MNIST')
      const rawDataDir = join(MNISTDataDir, 'raw')
      const model = 'model.pt'
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: rawDataDir }
      ] as ListOutput[])

      mockedStatus.mockResolvedValueOnce(({
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
          'always changed'
        ],
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as unknown) as StatusOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      const config = ({
        getCliPath: () => undefined
      } as unknown) as Config
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(dvcRoot, config, decorationProvider)
      await repository.isReady()

      const modified = new Set([resolve(dvcRoot, rawDataDir)])
      const tracked = new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, rawDataDir),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, MNISTDataDir)
      ])

      const expectedExecutionOptions = {
        cliPath: undefined,
        cwd: dvcRoot,
        pythonBinPath: undefined
      }

      expect(mockedStatus).toBeCalledWith(expectedExecutionOptions)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(
        expectedExecutionOptions
      )

      expect(repository.getState()).toEqual(
        expect.objectContaining({
          added: emptySet,
          deleted: emptySet,
          notInCache: emptySet,
          modified,
          stageModified: emptySet,
          tracked,
          untracked
        })
      )
    })
  })

  describe('resetState', () => {
    it('will not exclude changed outs from stages that are always changed', async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(new Set())

      const config = ({
        getCliPath: () => undefined
      } as unknown) as Config
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(dvcRoot, config, decorationProvider)
      await repository.isReady()

      const dataDir = 'data/MNIST/raw'
      const compressedDataset = join(dataDir, 't10k-images-idx3-ubyte.gz')
      const dataset = join(dataDir, 't10k-images-idx3-ubyte')
      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const model = 'model.pt'

      mockedStatus.mockResolvedValueOnce(({
        train: [
          {
            'changed deps': { 'data/MNIST': 'modified', 'train.py': 'modified' }
          },
          { 'changed outs': { 'model.pt': 'deleted' } },
          'always changed'
        ],
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'deleted' } }
        ]
      } as unknown) as StatusOutput)

      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: compressedDataset },
        { path: dataset },
        { path: logAcc },
        { path: logLoss },
        { path: model }
      ] as ListOutput[])

      expect(repository.getState()).toEqual(emptyState)

      await repository.resetState()

      const deleted = new Set([join(dvcRoot, model), join(dvcRoot, dataDir)])

      const tracked = new Set([
        resolve(dvcRoot, compressedDataset),
        resolve(dvcRoot, dataset),
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, dataDir),
        resolve(dvcRoot, logDir)
      ])

      const expectedExecutionOptions = {
        cliPath: undefined,
        cwd: dvcRoot,
        pythonBinPath: undefined
      }

      expect(mockedStatus).toBeCalledWith(expectedExecutionOptions)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(
        expectedExecutionOptions
      )

      expect(repository.getState()).toEqual({
        added: emptySet,
        deleted,
        modified: emptySet,
        notInCache: emptySet,
        stageModified: emptySet,
        tracked,
        untracked: emptySet
      })
    })

    it("should update the classes state and call it's dependents", async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(new Set())

      const config = ({
        getCliPath: () => undefined
      } as unknown) as Config
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(dvcRoot, config, decorationProvider)
      await repository.isReady()

      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const dataDir = 'data'
      const model = 'model.pt'
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: dataDir }
      ] as ListOutput[])

      mockedStatus.mockResolvedValueOnce(({
        prepare: [
          { 'changed deps': { 'data/data.xml': Status.NOT_IN_CACHE } },
          { 'changed outs': { 'data/prepared': Status.NOT_IN_CACHE } }
        ],
        featurize: [
          { 'changed deps': { 'data/prepared': Status.NOT_IN_CACHE } },
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
          { 'changed outs': { 'data/data.xml': Status.NOT_IN_CACHE } }
        ]
      } as unknown) as StatusOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py'),
        resolve(dvcRoot, 'some', 'untracked', 'go.go'),
        resolve(dvcRoot, 'some', 'untracked', 'perl.pl')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      expect(repository.getState()).toEqual(emptyState)

      await repository.resetState()

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

      const expectedExecutionOptions = {
        cliPath: undefined,
        cwd: dvcRoot,
        pythonBinPath: undefined
      }

      expect(mockedStatus).toBeCalledWith(expectedExecutionOptions)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(
        expectedExecutionOptions
      )

      expect(repository.getState()).toEqual({
        added: emptySet,
        deleted,
        modified,
        stageModified: emptySet,
        notInCache,
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
