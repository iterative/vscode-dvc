import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, resolve, sep } from 'path'
import { mocked } from 'ts-jest/utils'
import { ListOutput, StatusOutput } from '../cli/reader'
import { RepositoryState } from './State'

jest.mock('@hediet/std/disposable')

const mockedDisposable = mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('RepositoryState', () => {
  const dvcRoot = resolve(__dirname, '..', '..', 'demo')
  const emptySet = new Set()

  describe('updateStatus', () => {
    it('should correctly process the outputs of list, diff and status', () => {
      const deleted = join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte')
      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const model = 'model.pt'
      const predictions = 'predictions.json'
      const rawDataDir = join('data', 'MNIST', 'raw')
      const renamed = join('data', 'MNIST', 'raw', 'train-lulbels-idx9-ubyte')

      const tracked = [
        { path: deleted },
        { path: renamed },
        { path: logAcc },
        { path: logLoss },
        { path: model }
      ] as ListOutput[]

      const diff = {
        added: [],
        deleted: [{ path: deleted }],
        modified: [
          { path: rawDataDir + sep },
          { path: logDir + sep },
          { path: logAcc },
          { path: logLoss },
          { path: model },
          { path: predictions }
        ],
        renamed: [{ path: renamed }],
        'not in cache': []
      }

      const status = ({
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          {
            'changed outs': { 'predictions.json': 'modified', logs: 'modified' }
          },
          'always changed'
        ],
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as unknown) as StatusOutput

      const repositoryState = new RepositoryState(dvcRoot)
      repositoryState.updateTracked(tracked)
      repositoryState.updateStatus(diff, status)

      expect(repositoryState.getState()).toEqual({
        added: emptySet,
        deleted: new Set([join(dvcRoot, deleted)]),
        modified: new Set([
          join(dvcRoot, rawDataDir),
          join(dvcRoot, logDir),
          join(dvcRoot, logAcc),
          join(dvcRoot, logLoss)
        ]),
        notInCache: emptySet,
        renamed: new Set([join(dvcRoot, renamed)]),
        stageModified: new Set([join(dvcRoot, model)]),
        tracked: new Set([
          ...tracked.map(entry => join(dvcRoot, entry.path)),
          join(dvcRoot, rawDataDir),
          join(dvcRoot, logDir)
        ]),
        untracked: emptySet
      })
    })

    it('should handle an empty diff output', () => {
      const diff = {}

      const status = ({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as unknown) as StatusOutput

      const repositoryState = new RepositoryState(dvcRoot)
      repositoryState.updateStatus(diff, status)

      expect(repositoryState.getState()).toEqual({
        added: emptySet,
        deleted: emptySet,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        stageModified: emptySet,
        tracked: emptySet,
        untracked: emptySet
      })
    })

    it('should filter the diff down to tracked path', () => {
      const diff = {
        modified: [{ path: 'data/MNIST/raw' }]
      }

      const status = ({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as unknown) as StatusOutput

      const repositoryState = new RepositoryState(dvcRoot)
      repositoryState.updateStatus(diff, status)

      expect(repositoryState.getState()).toEqual({
        added: emptySet,
        deleted: emptySet,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        stageModified: emptySet,
        tracked: emptySet,
        untracked: emptySet
      })
    })
  })
})
