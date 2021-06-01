import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, resolve } from 'path'
import { SourceControlManagement } from './views/sourceControlManagement'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './decorationProvider'
import { Repository } from '.'
import { RepositoryModel } from './model'
import {
  CliReader,
  DiffOutput,
  ListOutput,
  Status,
  StatusOutput
} from '../cli/reader'
import { getAllUntracked } from '../git'

jest.mock('@hediet/std/disposable')
jest.mock('./views/sourceControlManagement')
jest.mock('./decorationProvider')
jest.mock('../cli/reader')
jest.mock('../git')
jest.mock('../fileSystem')

const mockedListDvcOnlyRecursive = jest.fn()
const mockedDiff = jest.fn()
const mockedStatus = jest.fn()
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
  const emptyState = new RepositoryModel(dvcRoot).getState()
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
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      } as unknown) as StatusOutput)

      mockedDiff.mockResolvedValueOnce({
        added: [],
        deleted: [],
        modified: [
          { path: model },
          { path: logDir },
          { path: logAcc },
          { path: logLoss },
          { path: MNISTDataDir }
        ],
        'not in cache': [],
        renamed: []
      } as DiffOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      const mockedCliReader = ({
        diff: mockedDiff,
        listDvcOnlyRecursive: mockedListDvcOnlyRecursive,
        status: mockedStatus
      } as unknown) as CliReader
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(
        dvcRoot,
        mockedCliReader,
        decorationProvider
      )
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

      expect(mockedDiff).toBeCalledWith(dvcRoot)
      expect(mockedStatus).toBeCalledWith(dvcRoot)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(dvcRoot)

      expect(repository.getState()).toEqual(
        expect.objectContaining({
          added: emptySet,
          deleted: emptySet,
          modified,
          notInCache: emptySet,
          renamed: emptySet,
          stageModified: emptySet,
          tracked,
          untracked
        })
      )
    })
  })

  describe('resetState', () => {
    it('will not exclude changed outs from stages that are always changed', async () => {
      mockedDiff.mockResolvedValueOnce({})
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(new Set())

      const mockedCliReader = ({
        diff: mockedDiff,
        listDvcOnlyRecursive: mockedListDvcOnlyRecursive,
        status: mockedStatus
      } as unknown) as CliReader
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(
        dvcRoot,
        mockedCliReader,
        decorationProvider
      )
      await repository.isReady()

      const dataDir = 'data/MNIST/raw'
      const compressedDataset = join(dataDir, 't10k-images-idx3-ubyte.gz')
      const dataset = join(dataDir, 't10k-images-idx3-ubyte')
      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const model = 'model.pt'

      mockedDiff.mockResolvedValueOnce(({
        added: [],
        deleted: [{ path: model }, { path: dataDir }],
        modified: [],
        'not in cache': []
      } as unknown) as DiffOutput)

      mockedStatus.mockResolvedValueOnce(({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'deleted' } }
        ],
        train: [
          {
            'changed deps': { 'data/MNIST': 'modified', 'train.py': 'modified' }
          },
          { 'changed outs': { 'model.pt': 'deleted' } },
          'always changed'
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

      expect(mockedDiff).toBeCalledWith(dvcRoot)
      expect(mockedStatus).toBeCalledWith(dvcRoot)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(dvcRoot)

      expect(repository.getState()).toEqual({
        added: emptySet,
        deleted,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        stageModified: emptySet,
        tracked,
        untracked: emptySet
      })
    })

    it("should update the classes state and call it's dependents", async () => {
      mockedDiff.mockResolvedValueOnce({})
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(new Set())

      const mockedCliReader = ({
        diff: mockedDiff,
        listDvcOnlyRecursive: mockedListDvcOnlyRecursive,
        status: mockedStatus
      } as unknown) as CliReader
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(
        dvcRoot,
        mockedCliReader,
        decorationProvider
      )
      await repository.isReady()

      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const dataDir = 'data'
      const features = join(dataDir, 'features')
      const dataXml = join(dataDir, 'data.xml')
      const prepared = join(dataDir, 'prepared')
      const model = 'model.pt'
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: dataDir },
        { path: features },
        { path: dataXml },
        { path: prepared }
      ] as ListOutput[])

      mockedDiff.mockResolvedValueOnce(({
        added: [],
        deleted: [{ path: model }],
        modified: [{ path: features }],
        'not in cache': [{ path: dataXml }, { path: prepared }]
      } as unknown) as DiffOutput)

      mockedStatus.mockResolvedValueOnce(({
        'data/data.xml.dvc': [
          { 'changed outs': { 'data/data.xml': Status.NOT_IN_CACHE } }
        ],
        evaluate: [
          {
            'changed deps': {
              'data/features': 'modified',
              'model.pkl': 'deleted'
            }
          }
        ],
        featurize: [
          { 'changed deps': { 'data/prepared': Status.NOT_IN_CACHE } },
          { 'changed outs': { 'data/features': 'modified' } }
        ],
        prepare: [
          { 'changed deps': { 'data/data.xml': Status.NOT_IN_CACHE } },
          { 'changed outs': { 'data/prepared': Status.NOT_IN_CACHE } }
        ],
        train: [
          { 'changed deps': { 'data/features': 'modified' } },
          { 'changed outs': { 'model.pt': 'deleted' } }
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

      const deleted = new Set([join(dvcRoot, model)])
      const modified = new Set([join(dvcRoot, 'data/features')])
      const notInCache = new Set([
        join(dvcRoot, 'data/data.xml'),
        join(dvcRoot, 'data/prepared')
      ])
      const tracked = new Set([
        resolve(dvcRoot, dataDir),
        resolve(dvcRoot, dataXml),
        resolve(dvcRoot, features),
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, prepared)
      ])

      expect(mockedStatus).toBeCalledWith(dvcRoot)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(dvcRoot)

      expect(repository.getState()).toEqual({
        added: emptySet,
        deleted,
        modified,
        notInCache,
        renamed: emptySet,
        stageModified: emptySet,
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
