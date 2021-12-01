import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore } from 'sinon'
import { buildRepositoryData } from './util'
import { Disposable } from '../../../extension'
import { dvcDemoPath } from '../../util'

suite('Repository Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('RepositoryData', () => {
    it('should not queue a full update within 200ms of one starting', async () => {
      const dataDir = join('data', 'MNIST', 'raw')
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      await Promise.all([
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(join(dvcDemoPath, dataDir) + '.dvc'),
        data.managedUpdate(join(dvcDemoPath, 'dvc.yaml')),
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(join(dvcDemoPath, dataDir) + '.dvc')
      ])

      expect(mockDiff).to.be.calledOnce
      expect(mockGetAllUntracked).to.be.calledOnce
      expect(mockListDvcOnlyRecursive).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should debounce all calls made within 200ms of a full update', async () => {
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      await Promise.all([
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(),
        data.managedUpdate(join(dvcDemoPath, 'dvc.yaml')),
        data.managedUpdate()
      ])

      expect(mockDiff).to.be.calledOnce
      expect(mockGetAllUntracked).to.be.calledOnce
      expect(mockListDvcOnlyRecursive).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should not queue a partial update within 200ms of one starting', async () => {
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      const firstUpdate = data.managedUpdate()

      await Promise.all([
        firstUpdate,
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate()
      ])

      expect(mockDiff).to.be.calledOnce
      expect(mockGetAllUntracked).to.be.calledOnce
      expect(mockListDvcOnlyRecursive).not.to.be.called
      expect(mockStatus).to.be.calledOnce
    })

    it('should run a partial update and queue a full update (and send further calls to the full update queue) if they are called in that order', async () => {
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      const firstUpdate = data.managedUpdate()
      const firstReset = data.managedUpdate(join(dvcDemoPath, 'dvc.lock'))

      await Promise.all([
        firstUpdate,
        firstReset,
        data.managedUpdate(),
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(),
        data.managedUpdate(join(dvcDemoPath, 'dvc.yaml'))
      ])

      expect(mockGetAllUntracked).to.be.calledTwice
      expect(mockDiff).to.be.calledTwice
      expect(mockListDvcOnlyRecursive).to.be.calledOnce
      expect(mockStatus).to.be.calledTwice
    })
  })
})
