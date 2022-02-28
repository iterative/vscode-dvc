import { join } from 'path'
import { Uri } from 'vscode'
import { collectTree } from './collect'
import { dvcDemoPath } from '../../test/util'

describe('collectTree', () => {
  const makeUri = (...paths: string[]): Uri =>
    Uri.file(join(dvcDemoPath, ...paths))
  const makeAbsPath = (...paths: string[]): string => makeUri(...paths).fsPath

  it('should transform recursive list output into a tree', () => {
    const paths = [
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
      join('logs', 'acc.tsv'),
      join('logs', 'loss.tsv'),
      'model.pt'
    ]

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
              isTracked: true,
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
