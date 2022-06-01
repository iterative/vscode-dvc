import { join } from 'path'
import { Uri } from 'vscode'
import { collectSelected, collectTree } from './collect'
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
      makeAbsPath('logs', 'acc.tsv'),
      makeAbsPath('logs', 'loss.tsv'),
      makeAbsPath('model.pt')
    ])

    const treeData = collectTree(
      dvcDemoPath,
      paths,
      new Set([join('data', 'MNIST', 'raw')])
    )

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

  it('should return an empty object if no path items are provided', () => {
    expect(collectSelected([])).toStrictEqual({})
  })

  it('should return the original item if only one is provided', () => {
    const selected = collectSelected([logsPathItem])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [logsPathItem]
    })
  })

  it('should return a root given it is select', () => {
    const selected = collectSelected([
      dvcDemoPath,
      logsPathItem,
      {
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: makeUri('logs', 'acc.tsv')
      }
    ])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [dvcDemoPath]
    })
  })

  it('should exclude all children from the final list', () => {
    const selected = collectSelected([
      {
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: makeUri('logs', 'loss.tsv')
      },
      {
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: makeUri('logs', 'acc.tsv')
      },
      logsPathItem
    ])

    expect(selected).toStrictEqual({
      [dvcDemoPath]: [logsPathItem]
    })
  })

  it('should return multiple entries when multiple roots are provided', () => {
    const mockOtherRepoItem = {
      dvcRoot: __dirname,
      isDirectory: true,
      isTracked: true,
      resourceUri: Uri.file(join(__dirname, 'mock', 'path'))
    }

    const selected = collectSelected([
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
})
