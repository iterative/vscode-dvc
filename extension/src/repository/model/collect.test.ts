import { join, sep } from 'path'
import { Uri } from 'vscode'
import { collectSelected, collectDataStatus, collectTree } from './collect'
import { dvcDemoPath } from '../../test/util'
import { makeAbsPathSet } from '../../test/util/path'

describe('collectDataStatus', () => {
  const emptySet = new Set()

  it('should transform the data status output into the correct shape', () => {
    const committedAdded = ['CA1', 'CA2', 'CA3']
    const committedDeleted = ['CD-A', 'CD-B']
    const committedModified = ['CM1', 'CM2', 'CM3']
    const committedRenamed = ['CR1']

    const uncommittedAdded = [join('some', 'nested', 'UA-XYZ')]
    const uncommittedDeleted = ['UD-C', 'UD-D']
    const uncommittedModified = ['UM']
    const uncommittedRenamed = ['UR1']

    const unchanged = ['A', 'B', 'C', 'D', join('E', 'F', 'G'), 'H']
    const untracked = [join('A1', 'B2', 'C3'), join('D4', 'E5', 'F6')]

    const data = collectDataStatus(dvcDemoPath, {
      committed: {
        added: committedAdded,
        deleted: committedDeleted,
        modified: committedModified,
        renamed: committedRenamed.map(path => ({
          new: path,
          old: join('dir', 'path')
        }))
      },
      unchanged,
      uncommitted: {
        added: uncommittedAdded,
        deleted: uncommittedDeleted,
        modified: uncommittedModified,
        renamed: uncommittedRenamed.map(path => ({
          new: path,
          old: join('dir', 'path')
        }))
      },
      untracked
    })

    expect(data).toStrictEqual({
      committedAdded: makeAbsPathSet(dvcDemoPath, ...committedAdded),
      committedDeleted: makeAbsPathSet(dvcDemoPath, ...committedDeleted),
      committedModified: makeAbsPathSet(dvcDemoPath, ...committedModified),
      committedRenamed: makeAbsPathSet(dvcDemoPath, ...committedRenamed),
      notInCache: emptySet,
      tracked: makeAbsPathSet(
        dvcDemoPath,
        ...committedAdded,
        ...committedDeleted,
        ...committedModified,
        ...committedRenamed,
        ...uncommittedAdded,
        ...uncommittedDeleted,
        ...uncommittedModified,
        ...uncommittedRenamed,
        ...unchanged
      ),
      trackedDecorations: makeAbsPathSet(
        dvcDemoPath,
        ...committedAdded,
        ...committedDeleted,
        ...committedModified,
        ...committedRenamed,
        ...uncommittedAdded,
        ...uncommittedDeleted,
        ...uncommittedModified,
        ...uncommittedRenamed,
        ...unchanged
      ),
      uncommittedAdded: makeAbsPathSet(dvcDemoPath, ...uncommittedAdded),
      uncommittedDeleted: makeAbsPathSet(dvcDemoPath, ...uncommittedDeleted),
      uncommittedModified: makeAbsPathSet(dvcDemoPath, ...uncommittedModified),
      uncommittedRenamed: makeAbsPathSet(dvcDemoPath, ...uncommittedRenamed),
      untracked: makeAbsPathSet(dvcDemoPath, ...untracked)
    })
  })

  it('should collect missing untracked parents', () => {
    const untracked = [
      'data' + sep,
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz')
    ]

    const {
      untracked: untrackedWithMissingParents,
      tracked,
      trackedDecorations
    } = collectDataStatus(dvcDemoPath, {
      untracked
    })
    expect(untrackedWithMissingParents).toStrictEqual(
      makeAbsPathSet(
        dvcDemoPath,
        ...untracked,
        join('data', 'MNIST', 'raw'),
        join('data', 'MNIST')
      )
    )
    expect(tracked).toStrictEqual(emptySet)
    expect(trackedDecorations).toStrictEqual(emptySet)
  })

  it('should collect missing tracked parents', () => {
    const tracked = [
      join('training_metrics', 'scalars', 'loss.tsv'),
      'training_metrics' + sep,
      join('training_metrics', 'scalars', 'acc.tsv'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
      join('model.pt'),
      join('data', 'MNIST', 'raw'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
      'misclassified.jpg',
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      'predictions.json',
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz')
    ]
    const { trackedDecorations: trackedWithMissingParents } = collectDataStatus(
      dvcDemoPath,
      {
        unchanged: tracked
      }
    )
    expect(trackedWithMissingParents).toStrictEqual(
      makeAbsPathSet(
        dvcDemoPath,
        ...tracked,
        join('training_metrics', 'scalars')
      )
    )
  })

  it('should return only not in cache when provided with duplicate paths', () => {
    const not_in_cache = ['model.pt', 'misclassified.jpg', 'predictions.json']

    const duplicates = {
      committed: {
        modified: ['model.pt', 'misclassified.jpg', 'predictions.json']
      },
      not_in_cache,
      uncommitted: {
        deleted: not_in_cache
      }
    }

    const { committedModified, notInCache, uncommittedDeleted, tracked } =
      collectDataStatus(dvcDemoPath, duplicates)

    const absNotInCache = makeAbsPathSet(dvcDemoPath, ...not_in_cache)

    expect(committedModified).toStrictEqual(emptySet)
    expect(uncommittedDeleted).toStrictEqual(emptySet)
    expect(notInCache).toStrictEqual(absNotInCache)
    expect(tracked).toStrictEqual(absNotInCache)
  })
})

const makeUri = (...paths: string[]): Uri =>
  Uri.file(join(dvcDemoPath, ...paths))

describe('collectTree', () => {
  const makeAbsPath = (...paths: string[]): string => makeUri(...paths).fsPath

  it('should transform recursive list output into a tree', () => {
    const paths = new Set([
      makeAbsPath('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      makeAbsPath('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
      makeAbsPath('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
      makeAbsPath('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
      makeAbsPath('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
      makeAbsPath('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
      makeAbsPath('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
      makeAbsPath('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
      makeAbsPath('data', 'MNIST', 'raw'),
      makeAbsPath('logs', 'acc.tsv'),
      makeAbsPath('logs', 'loss.tsv'),
      makeAbsPath('model.pt')
    ])

    const treeData = collectTree(dvcDemoPath, paths)

    expect(treeData).toStrictEqual(
      new Map([
        [
          dvcDemoPath,
          [
            {
              dvcRoot: dvcDemoPath,
              isDirectory: true,
              isTracked: false,
              resourceUri: makeUri('data')
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: true,
              isTracked: false,
              resourceUri: makeUri('logs')
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri('model.pt')
            }
          ]
        ],
        [
          makeAbsPath('data'),
          [
            {
              dvcRoot: dvcDemoPath,
              isDirectory: true,
              isTracked: false,
              resourceUri: makeUri('data', 'MNIST')
            }
          ]
        ],
        [
          makeAbsPath('data', 'MNIST'),
          [
            {
              dvcRoot: dvcDemoPath,
              isDirectory: true,
              isTracked: true,
              resourceUri: makeUri('data', 'MNIST', 'raw')
            }
          ]
        ],
        [
          makeAbsPath('data', 'MNIST', 'raw'),
          [
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                't10k-images-idx3-ubyte'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                't10k-images-idx3-ubyte.gz'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                't10k-labels-idx1-ubyte'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                't10k-labels-idx1-ubyte.gz'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                'train-images-idx3-ubyte'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                'train-images-idx3-ubyte.gz'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                'train-labels-idx1-ubyte'
              )
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri(
                'data',
                'MNIST',
                'raw',
                'train-labels-idx1-ubyte.gz'
              )
            }
          ]
        ],
        [
          makeAbsPath('logs'),
          [
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri('logs', 'acc.tsv')
            },
            {
              dvcRoot: dvcDemoPath,
              isDirectory: false,
              isTracked: true,
              resourceUri: makeUri('logs', 'loss.tsv')
            }
          ]
        ]
      ])
    )
  })
})

describe('collectSelected', () => {
  const logsPathItem = {
    dvcRoot: dvcDemoPath,
    isDirectory: true,
    isTracked: true,
    resourceUri: makeUri('logs')
  }

  const accPathItem = {
    dvcRoot: dvcDemoPath,
    isDirectory: false,
    isTracked: true,
    resourceUri: makeUri('logs', 'acc.tsv')
  }

  const lossPathItem = {
    dvcRoot: dvcDemoPath,
    isDirectory: false,
    isTracked: true,
    resourceUri: makeUri('logs', 'loss.tsv')
  }

  it('should return the original item if no other items are selected', () => {
    const selected = collectSelected(logsPathItem, [])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [logsPathItem]
    })
  })

  it('should return only the invoked item if it is not included in the selected paths', () => {
    const selected = collectSelected(lossPathItem, [accPathItem])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [lossPathItem]
    })
  })

  it('should return a root given it is select', () => {
    const selected = collectSelected(logsPathItem, [
      dvcDemoPath,
      logsPathItem,
      accPathItem
    ])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [dvcDemoPath]
    })
  })

  it('should return siblings if a parent is not provided', () => {
    const selected = collectSelected(lossPathItem, [accPathItem, lossPathItem])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [accPathItem, lossPathItem]
    })
  })

  it('should exclude all children from the final list', () => {
    const selected = collectSelected(logsPathItem, [
      lossPathItem,
      accPathItem,
      logsPathItem
    ])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [logsPathItem]
    })
  })

  it('should not exclude children from the final list if the invoked item is not in the selected list', () => {
    const selected = collectSelected(accPathItem, [lossPathItem, logsPathItem])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [accPathItem]
    })
  })

  it('should return multiple entries when multiple roots are provided', () => {
    const mockOtherRepoItem = {
      dvcRoot: __dirname,
      isDirectory: true,
      isTracked: true,
      resourceUri: Uri.file(join(__dirname, 'mock', 'path'))
    }

    const selected = collectSelected(logsPathItem, [
      mockOtherRepoItem,
      {
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: makeUri('logs', 'acc.tsv')
      },
      logsPathItem
    ])

    expect(selected).toStrictEqual({
      [__dirname]: [mockOtherRepoItem],
      [dvcDemoPath]: [logsPathItem]
    })
  })

  it('should only return the invoked item if multiple roots are provided but the invoked item is not selected', () => {
    const mockOtherRepoItem = {
      dvcRoot: __dirname,
      isDirectory: true,
      isTracked: true,
      resourceUri: Uri.file(join(__dirname, 'mock', 'path'))
    }

    const selected = collectSelected(logsPathItem, [
      mockOtherRepoItem,
      {
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: makeUri('logs', 'acc.tsv')
      }
    ])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [logsPathItem]
    })
  })
})
