import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { buildDependencies } from './util'
import { Disposable } from '../../../extension'
import { dvcDemoPath } from '../../util'
import { Repository } from '../../../repository'
import { RepositoryModel } from '../../../repository/model'
import {
  DiffOutput,
  ListOutput,
  Status,
  StatusOutput
} from '../../../cli/reader'
import { SourceControlManagement } from '../../../repository/sourceControlManagement'
import { DecorationProvider } from '../../../repository/decorationProvider'
import { bypassProcessManagerDebounce, FIRST_TRUTHY_TIME } from '../util'

suite('Repository Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  const emptyState = disposable
    .track(new RepositoryModel(dvcDemoPath))
    .getState()
  const emptySet = new Set<string>()

  const logDir = 'logs'
  const logAcc = join(logDir, 'acc.tsv')
  const logLoss = join(logDir, 'loss.tsv')
  const MNISTDir = join('data', 'MNIST')
  const dataDir = join(MNISTDir, 'raw')
  const model = 'model.pt'
  const compressedDataset = join(dataDir, 't10k-images-idx3-ubyte.gz')
  const dataset = join(dataDir, 't10k-images-idx3-ubyte')

  describe('isReady', () => {
    it('should wait for the state to be ready before resolving', async () => {
      const {
        internalCommands,
        mockDiff,
        mockGetAllUntracked,
        mockGetHasChanges,
        mockListDvcOnlyRecursive,
        mockStatus,
        updatesPaused,
        treeDataChanged
      } = buildDependencies(disposable)

      mockListDvcOnlyRecursive.resolves([
        { path: logAcc },
        { path: logLoss },
        { path: model },
        { path: dataDir }
      ] as ListOutput[])

      mockStatus.resolves({
        [dataDir]: [{ 'changed outs': { [dataDir]: 'modified' } }],
        train: [
          { 'changed deps': { [MNISTDir]: 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      } as unknown as StatusOutput)

      mockDiff.resolves({
        added: [],
        deleted: [],
        modified: [
          { path: model },
          { path: logDir },
          { path: logAcc },
          { path: logLoss },
          { path: dataDir }
        ],
        'not in cache': [],
        renamed: []
      } as DiffOutput)

      const untracked = new Set([
        resolve(dvcDemoPath, 'some', 'untracked', 'python.py')
      ])
      mockGetAllUntracked.resolves(untracked)
      mockGetHasChanges.resolves(true)

      const repository = disposable.track(
        new Repository(
          dvcDemoPath,
          internalCommands,
          updatesPaused,
          treeDataChanged
        )
      )
      await repository.isReady()

      const modified = new Set([
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, logDir),
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, dataDir)
      ])
      const tracked = new Set([
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, dataDir),
        resolve(dvcDemoPath, logDir),
        resolve(dvcDemoPath, 'data'),
        resolve(dvcDemoPath, MNISTDir)
      ])

      const hasRemote = new Set([
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, dataDir)
      ])

      expect(mockDiff).to.be.calledWith(dvcDemoPath)
      expect(mockStatus).to.be.calledWith(dvcDemoPath)
      expect(mockGetAllUntracked).to.be.calledWith(dvcDemoPath)
      expect(mockListDvcOnlyRecursive).to.be.calledWith(dvcDemoPath)
      expect(repository.getState()).to.deep.equal({
        added: emptySet,
        deleted: emptySet,
        gitModified: emptySet,
        hasGitChanges: true,
        hasRemote,
        modified,
        notInCache: emptySet,
        renamed: emptySet,
        tracked,
        untracked
      })
    })
  })

  describe('update', () => {
    it('will not exclude changed outs from stages that are always changed', async () => {
      const {
        internalCommands,
        mockDiff,
        mockGetAllUntracked,
        mockGetHasChanges,
        mockListDvcOnlyRecursive,
        mockNow,
        mockStatus,
        onDidChangeTreeData,
        treeDataChanged,
        updatesPaused
      } = buildDependencies(disposable)
      mockNow.returns(FIRST_TRUTHY_TIME)

      mockDiff
        .onFirstCall()
        .resolves({})
        .onSecondCall()
        .resolves({
          added: [],
          deleted: [{ path: model }, { path: dataDir }],
          modified: [],
          'not in cache': []
        } as unknown as DiffOutput)
      mockListDvcOnlyRecursive
        .onFirstCall()
        .resolves([])
        .onSecondCall()
        .resolves([
          { path: compressedDataset },
          { path: dataset },
          { path: logAcc },
          { path: logLoss },
          { path: model }
        ] as ListOutput[])
      mockStatus
        .onFirstCall()
        .resolves({})
        .onSecondCall()
        .resolves({
          [dataDir]: [{ 'changed outs': { [dataDir]: 'deleted' } }],
          train: [
            {
              'changed deps': {
                [MNISTDir]: 'modified',
                'train.py': 'modified'
              }
            },
            { 'changed outs': { [model]: 'deleted' } },
            'always changed'
          ]
        } as unknown as StatusOutput)
      mockGetAllUntracked.resolves(emptySet)
      mockGetHasChanges.resolves(false)

      const repository = disposable.track(
        new Repository(
          dvcDemoPath,
          internalCommands,
          updatesPaused,
          treeDataChanged
        )
      )
      await repository.isReady()

      bypassProcessManagerDebounce(mockNow)

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(onDidChangeTreeData(() => resolve(undefined)))
      )

      expect(repository.getState()).to.deep.equal(emptyState)
      expect(repository.hasChanges()).to.be.false

      await repository.update(join(dvcDemoPath, 'dvc.lock'))

      const deleted = new Set([
        join(dvcDemoPath, model),
        join(dvcDemoPath, dataDir),
        join(dvcDemoPath, compressedDataset),
        join(dvcDemoPath, dataset)
      ])

      const tracked = new Set([
        resolve(dvcDemoPath, compressedDataset),
        resolve(dvcDemoPath, dataset),
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, 'data'),
        resolve(dvcDemoPath, 'data', 'MNIST'),
        resolve(dvcDemoPath, dataDir),
        resolve(dvcDemoPath, logDir)
      ])

      const hasRemote = new Set([
        resolve(dvcDemoPath, compressedDataset),
        resolve(dvcDemoPath, dataset),
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model)
      ])

      await dataUpdateEvent

      expect(mockDiff).to.be.calledTwice
      expect(mockStatus).to.be.calledTwice
      expect(mockGetAllUntracked).to.be.calledTwice
      expect(mockGetHasChanges).to.be.calledTwice
      expect(mockListDvcOnlyRecursive).to.be.calledTwice

      expect(repository.getState()).to.deep.equal({
        added: emptySet,
        deleted,
        gitModified: emptySet,
        hasGitChanges: false,
        hasRemote,
        modified: emptySet,
        notInCache: emptySet,
        renamed: emptySet,
        tracked,
        untracked: emptySet
      })
      expect(repository.hasChanges()).to.be.true
    })

    it('should update the state and call all dependents', async () => {
      const model = 'model.pkl'
      const dataDir = 'data'
      const features = join(dataDir, 'features')
      const dataXml = join(dataDir, 'data.xml')
      const prepared = join(dataDir, 'prepared')
      const untracked = new Set([
        resolve(dvcDemoPath, 'some', 'untracked', 'python.py'),
        resolve(dvcDemoPath, 'some', 'untracked', 'go.go'),
        resolve(dvcDemoPath, 'some', 'untracked', 'perl.pl')
      ])

      const {
        internalCommands,
        mockDiff,
        mockGetAllUntracked,
        mockGetHasChanges,
        mockListDvcOnlyRecursive,
        mockNow,
        mockStatus,
        onDidChangeTreeData,
        updatesPaused,
        treeDataChanged
      } = buildDependencies(disposable)

      mockNow.resolves(FIRST_TRUTHY_TIME)
      mockDiff
        .onFirstCall()
        .resolves({})
        .onSecondCall()
        .resolves({
          added: [],
          deleted: [{ path: model }],
          modified: [{ path: features }],
          'not in cache': [{ path: dataXml }, { path: prepared }]
        } as unknown as DiffOutput)
      mockListDvcOnlyRecursive
        .onFirstCall()
        .resolves([])
        .onSecondCall()
        .resolves([
          { path: logAcc },
          { path: logLoss },
          { path: model },
          { path: dataDir },
          { path: features },
          { path: dataXml },
          { path: prepared }
        ] as ListOutput[])
      mockStatus
        .onFirstCall()
        .resolves({})
        .onSecondCall()
        .resolves({
          'data/data.xml.dvc': [
            { 'changed outs': { [dataXml]: Status.NOT_IN_CACHE } }
          ],
          evaluate: [
            {
              'changed deps': {
                [features]: 'modified',
                [model]: 'deleted'
              }
            }
          ],
          featurize: [
            { 'changed deps': { [prepared]: Status.NOT_IN_CACHE } },
            { 'changed outs': { [features]: 'modified' } }
          ],
          prepare: [
            { 'changed deps': { [dataXml]: Status.NOT_IN_CACHE } },
            { 'changed outs': { [prepared]: Status.NOT_IN_CACHE } }
          ],
          train: [
            { 'changed deps': { [features]: 'modified' } },
            { 'changed outs': { [model]: 'deleted' } }
          ]
        } as unknown as StatusOutput)
      mockGetAllUntracked
        .onFirstCall()
        .resolves(emptySet)
        .onSecondCall()
        .resolves(untracked)
      mockGetHasChanges.resolves(false)

      const repository = disposable.track(
        new Repository(
          dvcDemoPath,
          internalCommands,
          updatesPaused,
          treeDataChanged
        )
      )
      await repository.isReady()

      bypassProcessManagerDebounce(mockNow)

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(onDidChangeTreeData(() => resolve(undefined)))
      )
      const setDecorationStateSpy = spy(
        DecorationProvider.prototype,
        'setState'
      )
      const setScmStateSpy = spy(SourceControlManagement.prototype, 'setState')

      expect(repository.getState()).to.deep.equal(emptyState)
      expect(repository.hasChanges()).to.be.false

      await repository.update(join(dvcDemoPath, 'dvc.lock'))
      await dataUpdateEvent

      const deleted = new Set([join(dvcDemoPath, model)])
      const modified = new Set([join(dvcDemoPath, features)])
      const notInCache = new Set([
        join(dvcDemoPath, dataXml),
        join(dvcDemoPath, prepared)
      ])
      const tracked = new Set([
        resolve(dvcDemoPath, dataDir),
        resolve(dvcDemoPath, dataXml),
        resolve(dvcDemoPath, features),
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logDir),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, prepared)
      ])
      const hasRemote = new Set([
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, dataDir),
        resolve(dvcDemoPath, features),
        resolve(dvcDemoPath, dataXml),
        resolve(dvcDemoPath, prepared)
      ])

      expect(mockDiff).to.be.calledTwice
      expect(mockStatus).to.be.calledTwice
      expect(mockGetAllUntracked).to.be.calledTwice
      expect(mockGetHasChanges).to.be.calledTwice
      expect(mockListDvcOnlyRecursive).to.be.calledTwice

      expect(repository.getState()).to.deep.equal({
        added: emptySet,
        deleted,
        gitModified: emptySet,
        hasGitChanges: false,
        hasRemote,
        modified,
        notInCache,
        renamed: emptySet,
        tracked,
        untracked
      })

      expect(...setDecorationStateSpy.lastCall.args).to.deep.equal(
        repository.getState()
      )
      expect(...setScmStateSpy.lastCall.args).to.deep.equal(
        repository.getState()
      )
      expect(repository.hasChanges()).to.be.true
    })
  })
})
