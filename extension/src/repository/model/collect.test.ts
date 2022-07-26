import { join, resolve } from 'path'
import { Uri } from 'vscode'
import { collectMissingParents, collectSelected, collectTree } from './collect'
import { dvcDemoPath } from '../../test/util'

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

describe('collectMissingParents', () => {
  it('should collect missing untracked parents', () => {
    const untracked = new Set([
      resolve(dvcDemoPath, 'data/'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz')
    ])

    const untrackedWithMissingParents = collectMissingParents(
      dvcDemoPath,
      untracked
    )
    expect(untrackedWithMissingParents).toStrictEqual(
      new Set([
        ...untracked,
        resolve(dvcDemoPath, 'data', 'MNIST', 'raw'),
        resolve(dvcDemoPath, 'data', 'MNIST')
      ])
    )
  })

  it('should collect missing tracked parents', () => {
    const tracked = new Set<string>([
      resolve(dvcDemoPath, 'training_metrics', 'scalars', 'loss.tsv'),
      resolve(dvcDemoPath, 'training_metrics'),
      resolve(dvcDemoPath, 'training_metrics', 'scalars', 'acc.tsv'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
      resolve(dvcDemoPath, 'model.pt'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw'),
      resolve(
        dvcDemoPath,
        'data',
        'MNIST',
        'raw',
        'train-labels-idx1-ubyte.gz'
      ),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
      resolve(dvcDemoPath, 'misclassified.jpg'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      resolve(dvcDemoPath, 'predictions.json'),
      resolve(dvcDemoPath, 'data/MNIST/raw/train-labels-idx1-ubyte'),
      resolve(dvcDemoPath, 'data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz')
    ])
    const trackedWithMissingParents = collectMissingParents(
      dvcDemoPath,
      tracked
    )
    expect(trackedWithMissingParents).toStrictEqual(
      new Set([...tracked, resolve(dvcDemoPath, 'training_metrics', 'scalars')])
    )
  })
})
