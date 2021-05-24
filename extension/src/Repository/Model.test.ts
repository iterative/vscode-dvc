import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, resolve, sep } from 'path'
import { mocked } from 'ts-jest/utils'
import { StatusOutput } from '../cli/reader'
import { Model } from './Model'

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
    it('should correctly process the outputs of diff and status', () => {
      const deleted = join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte')
      const renamed = join('data', 'MNIST', 'raw', 'train-lulbels-idx9-ubyte')
      const predictions = 'predictions.json'
      const diff = {
        added: [],
        deleted: [{ path: deleted }],
        modified: [
          { path: join('data', 'MNIST', 'raw') + sep },
          { path: 'logs' + sep },
          { path: join('logs', 'acc.tsv') },
          { path: join('logs', 'loss.tsv') },
          { path: 'model.pt' },
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

      const repositoryState = new Model(dvcRoot)
      repositoryState.updateStatus(diff, status)

      expect(repositoryState.getState()).toEqual({
        added: emptySet,
        deleted: new Set([join(dvcRoot, deleted)]),
        modified: new Set([
          join(dvcRoot, 'data', 'MNIST', 'raw'),
          join(dvcRoot, 'logs'),
          join(dvcRoot, 'logs', 'acc.tsv'),
          join(dvcRoot, 'logs', 'loss.tsv'),
          join(dvcRoot, predictions)
        ]),
        notInCache: emptySet,
        renamed: new Set([join(dvcRoot, renamed)]),
        stageModified: new Set([join(dvcRoot, 'model.pt')]),
        tracked: emptySet,
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

      const repositoryState = new Model(dvcRoot)
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
