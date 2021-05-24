import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, resolve, sep } from 'path'
import { mocked } from 'ts-jest/utils'
import { StatusOutput } from '../cli/reader'
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
    it('should correctly process the outputs of diff and status', () => {
      const file = join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte')
      const predictions = 'predictions.json'
      const diff = {
        added: [],
        deleted: [{ path: file }],
        modified: [
          { path: join('data', 'MNIST', 'raw') + sep },
          { path: 'logs' + sep },
          { path: join('logs', 'acc.tsv') },
          { path: join('logs', 'loss.tsv') },
          { path: 'model.pt' },
          { path: predictions }
        ],
        renamed: [],
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
      repositoryState.updateStatus(diff, status)

      expect(repositoryState.getState()).toEqual({
        added: emptySet,
        deleted: new Set([join(dvcRoot, file)]),
        modified: new Set([
          join(dvcRoot, 'data', 'MNIST', 'raw'),
          join(dvcRoot, 'logs'),
          join(dvcRoot, 'logs', 'acc.tsv'),
          join(dvcRoot, 'logs', 'loss.tsv'),
          join(dvcRoot, predictions)
        ]),
        notInCache: emptySet,
        renamed: emptySet,
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
