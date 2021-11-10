import { join } from 'path'
import { Uri } from 'vscode'
import { collectTree } from './collect'
import { dvcDemoPath } from '../test/suite/util'

describe('collectTree', () => {
  const makeAbsPath = (...paths: string[]): string =>
    join(dvcDemoPath, ...paths)
  const makeUri = (...paths: string[]): Uri => Uri.file(makeAbsPath(...paths))

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
      join('model.pt')
    ]

    const treeData = collectTree(dvcDemoPath, paths)

    expect(treeData).toEqual(
      new Map([
        [dvcDemoPath, [makeUri('data'), makeUri('logs'), makeUri('model.pt')]],
        [makeAbsPath('data'), [makeUri('data', 'MNIST')]],
        [makeAbsPath('data', 'MNIST'), [makeUri('data', 'MNIST', 'raw')]],
        [
          makeAbsPath('data', 'MNIST', 'raw'),
          [
            makeUri('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
            makeUri('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
            makeUri('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
            makeUri('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
            makeUri('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
            makeUri('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
            makeUri('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
            makeUri('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz')
          ]
        ],
        [
          makeAbsPath('logs'),
          [makeUri('logs', 'acc.tsv'), makeUri('logs', 'loss.tsv')]
        ]
      ])
    )
  })
})
