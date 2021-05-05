import { stub } from 'sinon'
import { join } from 'path'
import * as DvcReader from '../../cli/reader'

export const beforeAll = () => {
  stub(DvcReader, 'listDvcOnlyRecursive').resolves([
    { path: join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte') },
    { path: join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz') },
    { path: join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte') },
    { path: join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz') },
    { path: join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte') },
    { path: join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz') },
    { path: join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte') },
    { path: join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz') },
    { path: join('logs', 'acc.tsv') },
    { path: join('logs', 'loss.tsv') },
    { path: 'model.pt' }
  ] as DvcReader.ListOutput[])

  stub(DvcReader, 'listDvcOnly').resolves([
    { isout: false, isdir: true, isexec: false, path: 'data' },
    { isout: true, isdir: true, isexec: false, path: 'logs' },
    { isout: true, isdir: false, isexec: false, path: 'model.pt' }
  ])

  stub(DvcReader, 'status').resolves({
    train: [
      { 'changed deps': { 'data/MNIST': 'modified' } },
      { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
      'always changed'
    ],
    'data/MNIST/raw.dvc': [{ 'changed outs': { 'data/MNIST/raw': 'modified' } }]
  })
}
