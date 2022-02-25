import { join, resolve, sep } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { RepositoryModel } from '.'
import { ListOutput, StatusOutput } from '../../cli/reader'
import { dvcDemoPath } from '../../test/util'

jest.mock('@hediet/std/disposable')

const mockedDisposable = jest.mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('RepositoryState', () => {
  const emptySet = new Set()

  describe('updateStatus', () => {
    it('should correctly process the outputs of list, diff and status', () => {
      const deleted = join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte')
      const logDir = 'logs'
      const scalarDir = join(logDir, 'scalar')
      const logAcc = join(scalarDir, 'acc.tsv')
      const logLoss = join(scalarDir, 'loss.tsv')
      const output = 'model.pt'
      const predictions = 'predictions.json'
      const rawDataDir = join('data', 'MNIST', 'raw')
      const renamed = join('data', 'MNIST', 'raw', 'train-lulbels-idx9-ubyte')

      const list = [
        { path: deleted },
        { path: renamed },
        { path: logAcc },
        { path: logLoss },
        { path: output }
      ] as ListOutput[]

      const diff = {
        added: [],
        deleted: [{ path: deleted }],
        modified: [
          { path: rawDataDir + sep },
          { path: logDir + sep },
          { path: logAcc },
          { path: logLoss },
          { path: output },
          { path: predictions }
        ],
        'not in cache': [],
        renamed: [{ path: { new: renamed, old: 'does not matter' } }]
      }

      const status = {
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          {
            'changed outs': {
              [logDir]: 'modified',
              'predictions.json': 'modified'
            }
          },
          'always changed'
        ]
      } as StatusOutput

      const model = new RepositoryModel(dvcDemoPath)
      model.setState({
        diffFromCache: status,
        diffFromHead: diff,
        tracked: list,
        untracked: new Set<string>()
      })

      expect(model.getState()).toEqual({
        added: emptySet,
        deleted: new Set([join(dvcDemoPath, deleted)]),
        gitModified: new Set([join(dvcDemoPath, output)]),
        modified: new Set([
          join(dvcDemoPath, rawDataDir),
          join(dvcDemoPath, logDir),
          join(dvcDemoPath, logAcc),
          join(dvcDemoPath, logLoss)
        ]),
        notInCache: emptySet,
        renamed: new Set([join(dvcDemoPath, renamed)]),
        tracked: new Set([
          ...list.map(entry => join(dvcDemoPath, entry.path)),
          join(dvcDemoPath, 'data'),
          join(dvcDemoPath, 'data', 'MNIST'),
          join(dvcDemoPath, rawDataDir),
          join(dvcDemoPath, logDir),
          join(dvcDemoPath, scalarDir)
        ]),
        untracked: emptySet
      })
    })

    it('should handle an empty status output', () => {
      const rawDataDir = join('data', 'MNIST', 'raw')
      const data = join(rawDataDir, 'train-labels-idx2-ubyte')

      const list = [{ path: data }] as ListOutput[]

      const diff = {
        modified: [{ path: rawDataDir }, { path: data }]
      }

      const status = {}

      const model = new RepositoryModel(dvcDemoPath)
      model.setState({
        diffFromCache: status,
        diffFromHead: diff,
        tracked: list,
        untracked: new Set<string>()
      })

      expect(model.getState()).toEqual({
        added: emptySet,
        deleted: emptySet,
        gitModified: new Set([
          join(dvcDemoPath, rawDataDir),
          join(dvcDemoPath, data)
        ]),
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        tracked: new Set([
          join(dvcDemoPath, data),
          join(dvcDemoPath, 'data'),
          join(dvcDemoPath, 'data', 'MNIST'),
          join(dvcDemoPath, rawDataDir)
        ]),
        untracked: emptySet
      })
    })

    it('should handle an empty diff output', () => {
      const rawDataDir = join('data', 'MNIST', 'raw')
      const data = join(rawDataDir, 'train-labels-idx3-ubyte')

      const list = [{ path: data }] as ListOutput[]

      const diff = {}

      const status = {
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as StatusOutput

      const model = new RepositoryModel(dvcDemoPath)
      model.setState({
        diffFromCache: status,
        diffFromHead: diff,
        tracked: list,
        untracked: new Set<string>()
      })

      expect(model.getState()).toEqual({
        added: emptySet,
        deleted: emptySet,
        gitModified: emptySet,
        modified: new Set([join(dvcDemoPath, rawDataDir)]),
        notInCache: emptySet,
        renamed: emptySet,
        tracked: new Set([
          join(dvcDemoPath, 'data'),
          join(dvcDemoPath, 'data', 'MNIST'),
          join(dvcDemoPath, data),
          join(dvcDemoPath, rawDataDir)
        ]),
        untracked: emptySet
      })
    })

    it('should filter the diff and status down to tracked paths', () => {
      const diff = {
        modified: [{ path: 'data/MNIST/raw' }]
      }

      const status = {
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as StatusOutput

      const model = new RepositoryModel(dvcDemoPath)
      model.setState({
        diffFromCache: status,
        diffFromHead: diff,
        untracked: new Set<string>()
      })

      expect(model.getState()).toEqual({
        added: emptySet,
        deleted: emptySet,
        gitModified: emptySet,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        tracked: emptySet,
        untracked: emptySet
      })
    })

    it('should display a dataset as not in cache if some of the data is missing', () => {
      const diff = {
        added: [],
        deleted: [],
        modified: [
          {
            path: 'data/MNIST/raw/'
          }
        ],
        'not in cache': [
          {
            path: 'data/MNIST/raw/t10k-images-idx3-ubyte'
          },
          {
            path: 'data/MNIST/raw/t10k-images-idx3-ubyte.gz'
          },
          {
            path: 'data/MNIST/raw/t10k-labels-idx1-ubyte.gz'
          },
          {
            path: 'data/MNIST/raw/train-images-idx3-ubyte'
          },
          {
            path: 'data/MNIST/raw/train-images-idx3-ubyte.gz'
          },
          {
            path: 'data/MNIST/raw/train-labels-idx1-ubyte'
          },
          {
            path: 'data/MNIST/raw/train-labels-idx1-ubyte.gz'
          }
        ],
        renamed: []
      }

      const status = {
        'data/MNIST/raw.dvc': [
          {
            'changed outs': {
              'data/MNIST/raw': 'not in cache'
            }
          }
        ],
        train: [
          {
            'changed deps': {
              'data/MNIST': 'modified',
              'train.py': 'modified'
            }
          },
          {
            'changed outs': {
              logs: 'not in cache',
              'model.pt': 'not in cache'
            }
          },
          'always changed'
        ]
      } as StatusOutput

      const list = [
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('logs', 'acc.tsv')
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: join('logs', 'loss.tsv')
        },
        {
          isdir: false,
          isexec: false,
          isout: true,
          path: join('model.pt')
        }
      ]

      const model = new RepositoryModel(dvcDemoPath)
      model.setState({
        diffFromCache: status,
        diffFromHead: diff,
        tracked: list,
        untracked: new Set<string>()
      })

      expect(model.getState()).toStrictEqual({
        added: emptySet,
        deleted: emptySet,
        gitModified: emptySet,
        modified: emptySet,
        notInCache: new Set([
          ...diff['not in cache'].map(({ path }) => resolve(dvcDemoPath, path)),
          ...diff.modified.map(({ path }) => resolve(dvcDemoPath, path))
        ]),
        renamed: emptySet,
        tracked: new Set([
          ...list.map(({ path }) => resolve(dvcDemoPath, path)),
          resolve(dvcDemoPath, 'data'),
          resolve(dvcDemoPath, 'data', 'MNIST'),
          resolve(dvcDemoPath, 'data', 'MNIST', 'raw'),
          resolve(dvcDemoPath, 'logs')
        ]),
        untracked: emptySet
      })
    })
  })
})
