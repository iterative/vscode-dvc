import { Disposable, Disposer } from '@hediet/std/disposable'
import { join, sep } from 'path'
import { mocked } from 'ts-jest/utils'
import { RepositoryState, StatusOutput } from './State'

jest.mock('@hediet/std/disposable')

const mockedDisposable = mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValue(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('RepositoryState', () => {
  const dvcRoot = join(__dirname, '..', '..', 'demo')

  describe('update', () => {
    it('should deal with the differences between diff and status', () => {
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

      const emptySet = new Set()

      expect(repositoryState).toEqual({
        added: emptySet,
        dispose: Disposable.fn(),
        dvcRoot,
        deleted: new Set([join(dvcRoot, file)]),
        notInCache: emptySet,
        stageModified: new Set([join(dvcRoot, 'model.pt')]),
        modified: new Set([
          join(dvcRoot, 'data', 'MNIST', 'raw'),
          join(dvcRoot, 'logs'),
          join(dvcRoot, 'logs', 'acc.tsv'),
          join(dvcRoot, 'logs', 'loss.tsv'),
          join(dvcRoot, predictions)
        ]),
        tracked: emptySet,
        untracked: emptySet
      })
    })
  })
})
