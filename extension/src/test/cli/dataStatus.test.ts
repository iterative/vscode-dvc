import { join, sep } from 'path'
import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { dvcReader, initializeDemoRepo, initializeEmptyRepo } from './util'
import { dvcDemoPath } from '../util'
import { DataStatusOutput } from '../../cli/dvc/contract'

suite('data status --granular --unchanged --show-json', () => {
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      await initializeDemoRepo()

      const output = (await dvcReader.dataStatus(
        dvcDemoPath
      )) as DataStatusOutput

      const demoRepoTrackedData = [
        'data' + sep,
        join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
        join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
        join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
        join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
        join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
        join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
        join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
        join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
        'hist.csv',
        'model.pt',
        join('training', 'plots') + sep,
        join('training', 'plots', 'images', 'misclassified.jpg'),
        join('training', 'plots', 'metrics', 'test', 'acc.tsv'),
        join('training', 'plots', 'metrics', 'test', 'loss.tsv'),
        join('training', 'plots', 'metrics', 'train', 'acc.tsv'),
        join('training', 'plots', 'metrics', 'train', 'loss.tsv'),
        join('training', 'plots', 'sklearn', 'confusion_matrix.json')
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
      const output = await dvcReader.dataStatus(TEMP_DIR)

      expect(output).to.deep.equal({})
    })
  })
})
