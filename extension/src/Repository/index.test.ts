import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, resolve } from 'path'
import { Config } from '../Config'
import { SourceControlManagement } from './views/SourceControlManagement'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository, RepositoryState } from '.'
import {
  diff,
  DiffOutput,
  listDvcOnlyRecursive,
  ListOutput
} from '../cli/reader'
import { getAllUntracked } from '../git'

jest.mock('@hediet/std/disposable')
jest.mock('./views/SourceControlManagement')
jest.mock('./DecorationProvider')
jest.mock('../cli/reader')
jest.mock('../git')
jest.mock('../fileSystem')

const mockedDiff = mocked(diff)
const mockedListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)
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

  const emptyDiff = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    'not in cache': []
  }

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

      mockedDiff.mockResolvedValueOnce({
        added: [],
        deleted: [],
        modified: [
          { path: 'model.pt' },
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

      const config = ({
        getCliPath: () => undefined
      } as unknown) as Config
      const decorationProvider = new DecorationProvider()

      const repository = new Repository(dvcRoot, config, decorationProvider)
      await repository.isReady()

      const modified = new Set([
        resolve(dvcRoot, rawDataDir),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model)
      ])
      const tracked = new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, rawDataDir),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, MNISTDataDir)
      ])
      const emptySet = new Set()

      const expectedExecutionOptions = {
        cliPath: undefined,
        cwd: dvcRoot,
        pythonBinPath: undefined
      }

      expect(mockedDiff).toBeCalledWith(expectedExecutionOptions)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(
        expectedExecutionOptions
      )

      expect(repository.getState()).toEqual(
        expect.objectContaining({
          added: emptySet,
          dispose: Disposable.fn(),
          deleted: emptySet,
          notInCache: emptySet,
          modified,
          tracked,
          untracked
        })
      )
    })
  })

  describe('resetState', () => {
    it('will not exclude changed outs from stages that are always changed', async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedDiff.mockResolvedValueOnce(emptyDiff)
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

      mockedDiff.mockResolvedValueOnce(({
        added: [],
        deleted: [{ path: model }, { path: dataDir }],
        modified: [],
        'not in cache': []
      } as unknown) as DiffOutput)

      const emptySet = new Set<string>()

      mockedGetAllUntracked.mockResolvedValueOnce(emptySet)

      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: compressedDataset },
        { path: dataset },
        { path: logAcc },
        { path: logLoss },
        { path: model }
      ] as ListOutput[])

      expect(repository.getState()).toEqual(new RepositoryState())

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

      expect(mockedDiff).toBeCalledWith(expectedExecutionOptions)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(
        expectedExecutionOptions
      )

      expect(repository.getState()).toEqual({
        added: emptySet,
        dispose: Disposable.fn(),
        modified: emptySet,
        notInCache: emptySet,
        deleted,
        tracked,
        untracked: emptySet
      })
    })

    it("should update the classes state and call it's dependents", async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedDiff.mockResolvedValueOnce(emptyDiff)
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
      const model = 'model.pkl'
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: dataDir }
      ] as ListOutput[])

      mockedDiff.mockResolvedValueOnce(({
        added: [],
        modified: [{ path: 'data/features' }],
        deleted: [{ path: model }],
        'not in cache': [{ path: 'data/data.xml' }, { path: 'data/prepared' }]
      } as unknown) as DiffOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py'),
        resolve(dvcRoot, 'some', 'untracked', 'go.go'),
        resolve(dvcRoot, 'some', 'untracked', 'perl.pl')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      expect(repository.getState()).toEqual(new RepositoryState())

      await repository.resetState()

      const deleted = new Set([join(dvcRoot, 'model.pkl')])
      const modified = new Set([join(dvcRoot, 'data/features')])
      const notInCache = new Set([
        join(dvcRoot, 'data/prepared'),
        join(dvcRoot, 'data/data.xml')
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

      expect(mockedDiff).toBeCalledWith(expectedExecutionOptions)
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith(
        expectedExecutionOptions
      )

      expect(repository.getState()).toEqual({
        added: new Set(),
        dispose: Disposable.fn(),
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
