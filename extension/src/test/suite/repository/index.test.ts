import { join, resolve } from 'path'
import { beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader, ListOutput, StatusOutput } from '../../../cli/reader'
import { Config } from '../../../config'
import { InternalCommands } from '../../../internalCommands'
import { Repository } from '../../../repository'

chai.use(sinonChai)
const { expect } = chai

suite('Repository Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  describe('resetState', () => {
    it('should queue a reset and return early if a reset is in progress', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockList = stub(cliReader, 'listDvcOnlyRecursive').resolves([
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
      ] as ListOutput[])

      const mockDiff = stub(cliReader, 'diff').resolves({
        modified: [
          { path: 'model.pt' },
          { path: 'logs' },
          { path: 'data/MNIST/raw' }
        ]
      })

      const mockStatus = stub(cliReader, 'status').resolves({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      } as unknown as StatusOutput)
      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const repository = disposable.track(
        new Repository(dvcDemoPath, internalCommands)
      )
      await repository.isReady()
      mockList.resetHistory()
      mockDiff.resetHistory()
      mockStatus.resetHistory()

      await Promise.all([
        repository.resetState(),
        repository.resetState(),
        repository.resetState(),
        repository.resetState(),
        repository.resetState()
      ])

      expect(mockList).to.be.calledTwice
      expect(mockDiff).to.be.calledTwice
      expect(mockStatus).to.be.calledTwice
    })
  })
})
