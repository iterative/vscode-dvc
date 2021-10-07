import { join, resolve } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Repository } from '.'
import { SourceControlManagement } from './sourceControlManagement'
import { DecorationProvider } from './decorationProvider'
import { RepositoryModel } from './model'
import { DiffOutput, ListOutput, Status, StatusOutput } from '../cli/reader'
import { getAllUntracked } from '../git'
import { delay } from '../util/time'
import { InternalCommands } from '../commands/internal'
import { Config } from '../config'
import { OutputChannel } from '../vscode/outputChannel'

jest.mock('@hediet/std/disposable')
jest.mock('./sourceControlManagement')
jest.mock('./decorationProvider')
jest.mock('../cli/reader')
jest.mock('../git')
jest.mock('../fileSystem')
jest.mock('../util/time')
jest.mock('../common/logger')

const mockedListDvcOnlyRecursive = jest.fn()
const mockedDiff = jest.fn()
const mockedStatus = jest.fn()
const mockedGetAllUntracked = mocked(getAllUntracked)

const mockedSourceControlManagement = mocked(SourceControlManagement)
const mockedSetScmState = jest.fn()

const mockedDecorationProvider = mocked(new DecorationProvider())
const mockedSetDecorationState = jest.fn()
mockedDecorationProvider.setState = mockedSetDecorationState

const mockedDisposable = mocked(Disposable)

const mockedDelay = mocked(delay)

const mockedInternalCommands = new InternalCommands(
  {} as Config,
  {
    show: jest.fn()
  } as unknown as OutputChannel
)
mockedInternalCommands.registerCommand('diff', (...args) => mockedDiff(...args))
mockedInternalCommands.registerCommand('listDvcOnlyRecursive', (...args) =>
  mockedListDvcOnlyRecursive(...args)
)
mockedInternalCommands.registerCommand('status', (...args) =>
  mockedStatus(...args)
)

beforeEach(() => {
  jest.resetAllMocks()

  mockedSourceControlManagement.mockImplementationOnce(function () {
    return {
      setState: mockedSetScmState
    } as unknown as SourceControlManagement
  })

  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('Repository', () => {
  const dvcRoot = resolve(__dirname, '..', '..', 'demo')
  const emptyState = new RepositoryModel(dvcRoot).getState()
  const emptySet = new Set<string>()

  const logDir = 'logs'
  const logAcc = join(logDir, 'acc.tsv')
  const logLoss = join(logDir, 'loss.tsv')
  const MNISTDir = join('data', 'MNIST')
  const dataDir = join(MNISTDir, 'raw')
  const model = 'model.pt'
  const compressedDataset = join(dataDir, 't10k-images-idx3-ubyte.gz')
  const dataset = join(dataDir, 't10k-images-idx3-ubyte')

  describe('ready', () => {
    it('should wait for the state to be ready before resolving', async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: dataDir }
      ] as ListOutput[])

      mockedStatus.mockResolvedValueOnce({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      } as unknown as StatusOutput)

      mockedDiff.mockResolvedValueOnce({
        added: [],
        deleted: [],
        modified: [
          { path: model },
          { path: logDir },
          { path: logAcc },
          { path: logLoss },
          { path: MNISTDir }
        ],
        'not in cache': [],
        renamed: []
      } as DiffOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      const repository = new Repository(
        dvcRoot,
        mockedInternalCommands,
        mockedDecorationProvider
      )
      await repository.isReady()

      const modified = new Set([resolve(dvcRoot, dataDir)])
      const tracked = new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, dataDir),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, MNISTDir)
      ])

      expect(mockedDiff).toBeCalledWith(dvcRoot)
      expect(mockedStatus).toBeCalledWith(dvcRoot)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(dvcRoot)

      expect(repository.getState()).toEqual(
        expect.objectContaining({
          added: emptySet,
          deleted: emptySet,
          gitModified: emptySet,
          modified,
          notInCache: emptySet,
          renamed: emptySet,
          tracked,
          untracked
        })
      )
    })
  })

  describe('reset', () => {
    it('will not exclude changed outs from stages that are always changed', async () => {
      mockedDiff.mockResolvedValueOnce({})
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      const repository = new Repository(
        dvcRoot,
        mockedInternalCommands,
        mockedDecorationProvider
      )
      await repository.isReady()

      mockedDiff.mockResolvedValueOnce({
        added: [],
        deleted: [{ path: model }, { path: dataDir }],
        modified: [],
        'not in cache': []
      } as unknown as DiffOutput)

      mockedStatus.mockResolvedValueOnce({
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
      } as unknown as StatusOutput)

      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: compressedDataset },
        { path: dataset },
        { path: logAcc },
        { path: logLoss },
        { path: model }
      ] as ListOutput[])

      expect(repository.getState()).toEqual(emptyState)

      await repository.reset()

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
        gitModified: emptySet,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        tracked,
        untracked: emptySet
      })
    })

    it("should update the classes state and call it's dependents", async () => {
      mockedDiff.mockResolvedValueOnce({})
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      const repository = new Repository(
        dvcRoot,
        mockedInternalCommands,
        mockedDecorationProvider
      )
      await repository.isReady()

      const dataDir = 'data'
      const features = join(dataDir, 'features')
      const dataXml = join(dataDir, 'data.xml')
      const prepared = join(dataDir, 'prepared')

      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: dataDir },
        { path: features },
        { path: dataXml },
        { path: prepared }
      ] as ListOutput[])

      mockedDiff.mockResolvedValueOnce({
        added: [],
        deleted: [{ path: model }],
        modified: [{ path: features }],
        'not in cache': [{ path: dataXml }, { path: prepared }]
      } as unknown as DiffOutput)

      mockedStatus.mockResolvedValueOnce({
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
      } as unknown as StatusOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py'),
        resolve(dvcRoot, 'some', 'untracked', 'go.go'),
        resolve(dvcRoot, 'some', 'untracked', 'perl.pl')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      expect(repository.getState()).toEqual(emptyState)

      await repository.reset()

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
        gitModified: emptySet,
        modified,
        notInCache,
        renamed: emptySet,
        tracked,
        untracked
      })

      expect(mockedSetDecorationState).toHaveBeenLastCalledWith(
        repository.getState()
      )
      expect(mockedSetScmState).toHaveBeenLastCalledWith(repository.getState())
    })

    it('should retry commands on an individual basis (currently synchronous)', async () => {
      mockedDiff.mockResolvedValueOnce({})
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      const repository = new Repository(
        dvcRoot,
        mockedInternalCommands,
        mockedDecorationProvider
      )
      await repository.isReady()

      mockedDiff
        .mockReset()
        .mockRejectedValueOnce("I tried but I just couldn't do it")
        .mockResolvedValueOnce({
          added: [],
          deleted: [{ path: model }, { path: dataDir }],
          modified: [],
          'not in cache': []
        } as unknown as DiffOutput)

      mockedStatus
        .mockReset()
        .mockResolvedValueOnce({
          'data/MNIST/raw.dvc': [
            { 'changed outs': { 'data/MNIST/raw': 'deleted' } }
          ],
          train: [
            {
              'changed deps': {
                'data/MNIST': 'modified',
                'train.py': 'modified'
              }
            },
            { 'changed outs': { 'model.pt': 'deleted' } }
          ]
        } as unknown as StatusOutput)
        .mockRejectedValueOnce('I would have failed on the second attempt')

      mockedGetAllUntracked.mockReset().mockResolvedValueOnce(emptySet)

      mockedListDvcOnlyRecursive
        .mockReset()
        .mockResolvedValueOnce([
          { path: compressedDataset },
          { path: dataset },
          { path: logAcc },
          { path: logLoss },
          { path: model }
        ] as ListOutput[])

      expect(repository.getState()).toEqual(emptyState)
      mockedDelay.mockResolvedValueOnce().mockResolvedValueOnce()

      await repository.reset()

      expect(mockedDelay).toBeCalledTimes(1)
      expect(mockedDelay).toBeCalledWith(500)

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

      expect(mockedDiff).toBeCalledTimes(2)
      expect(mockedStatus).toBeCalledTimes(1)
      expect(mockedGetAllUntracked).toBeCalledTimes(1)
      expect(mockedListDvcOnlyRecursive).toBeCalledTimes(1)

      expect(repository.getState()).toEqual({
        added: emptySet,
        deleted,
        gitModified: emptySet,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        tracked,
        untracked: emptySet
      })
    })
  })

  describe('update', () => {
    it('should retry commands on an individual basis (currently synchronous)', async () => {
      mockedDiff.mockResolvedValueOnce({})
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: dataDir },
        { path: logDir },
        { path: model }
      ] as ListOutput[])
      mockedStatus.mockResolvedValueOnce({})
      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      const repository = new Repository(
        dvcRoot,
        mockedInternalCommands,
        mockedDecorationProvider
      )
      await repository.isReady()

      mockedDiff
        .mockReset()
        .mockRejectedValueOnce("I also tried but I just couldn't do it")
        .mockRejectedValueOnce("I still couldn't do it")
        .mockResolvedValueOnce({
          added: [],
          deleted: [{ path: model }],
          modified: [{ path: dataDir }],
          'not in cache': []
        } as unknown as DiffOutput)

      mockedStatus
        .mockReset()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce('I would have failed on the second attempt')

      mockedGetAllUntracked.mockReset().mockResolvedValueOnce(emptySet)
      mockedDelay.mockResolvedValueOnce().mockResolvedValueOnce()

      await repository.update()

      expect(mockedDelay).toBeCalledTimes(2)
      expect(mockedDelay).toBeCalledWith(500)
      expect(mockedDelay).toBeCalledWith(1000)

      const deleted = new Set([join(dvcRoot, model)])
      const gitModified = new Set([join(dvcRoot, dataDir)])

      const tracked = new Set([
        resolve(dvcRoot, model),
        resolve(dvcRoot, MNISTDir),
        resolve(dvcRoot, dataDir),
        resolve(dvcRoot, logDir)
      ])

      expect(mockedDiff).toBeCalledTimes(3)
      expect(mockedStatus).toBeCalledTimes(1)
      expect(mockedGetAllUntracked).toBeCalledTimes(1)
      expect(mockedListDvcOnlyRecursive).toBeCalledTimes(1)

      expect(repository.getState()).toEqual({
        added: emptySet,
        deleted,
        gitModified,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        tracked,
        untracked: emptySet
      })
    })
  })
})
