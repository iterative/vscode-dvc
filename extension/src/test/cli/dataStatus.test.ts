import { join, sep } from 'path'
import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { cliReader, initializeDemoRepo, initializeEmptyRepo } from './util'
import { dvcDemoPath } from '../util'

suite('data status --with-dirs --granular --unchanged --show-json', () => {
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      await initializeDemoRepo()

      const output = await cliReader.dataStatus(dvcDemoPath)

      const demoRepoTrackedData = [
        join('data', 'MNIST', 'raw') + sep,
        join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
        join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
        join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
        join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
        join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
        join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
        join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
        join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
        'misclassified.jpg',
        'model.pt',
        'predictions.json',
        'training_metrics' + sep,
        join('training_metrics', 'scalars', 'acc.tsv'),
        join('training_metrics', 'scalars', 'loss.tsv')
      ].sort()

      const collectedPaths = [
        ...(output.committed?.modified || []),
        ...(output.unchanged || [])
      ].sort()

      expect(
        collectedPaths,
        'all expected paths are either unchanged or committed modified after pulling'
      ).to.deep.equal(demoRepoTrackedData)
      expect(
        output.not_in_cache,
        'not in cache should be undefined after after pulling'
      ).to.be.undefined
      expect(output.committed?.added).to.be.undefined
      expect(output.committed?.deleted).to.be.undefined
      expect(output.committed?.renamed).to.be.undefined
      expect(output.uncommitted?.added).to.be.undefined
      expect(output.uncommitted?.deleted).to.be.undefined
      expect(output.uncommitted?.modified).to.be.undefined
      expect(output.uncommitted?.renamed).to.be.undefined
    })
  })

  describe('Empty Repository', () => {
    it('should return the expected output', async () => {
      await initializeEmptyRepo()
      const output = await cliReader.dataStatus(TEMP_DIR)

      expect(output).to.deep.equal({})
    })
  })
})
