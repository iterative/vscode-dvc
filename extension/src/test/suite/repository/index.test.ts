import { join, resolve } from 'path'
import { Uri } from 'vscode'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore } from 'sinon'
import { buildDependencies, buildRepository } from './util'
import { Disposable } from '../../../extension'
import { dvcDemoPath } from '../../util'
import { bypassProcessManagerDebounce, FIRST_TRUTHY_TIME } from '../util'
import { SourceControlDataStatus } from '../../../repository/sourceControlManagement'
import { makeAbsPathSet } from '../../util/path'

suite('Repository Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  const emptySet = new Set<string>()

  const logDir = 'logs'
  const logAcc = join(logDir, 'acc.tsv')
  const logLoss = join(logDir, 'loss.tsv')
  const MNISTDir = join('data', 'MNIST')
  const dataDir = join(MNISTDir, 'raw')
  const model = 'model.pt'
  const dataset = join(dataDir, 't10k-images-idx3-ubyte')

  describe('isReady', () => {
    it('should wait for the state to be ready before resolving', async () => {
      const {
        internalCommands,
        mockDataStatus,
        mockGetAllUntracked,
        mockGetHasChanges,
        updatesPaused,
        treeDataChanged
      } = buildDependencies(disposable)

      mockDataStatus.resolves({
        uncommitted: {
          modified: [model, logDir, logAcc, logLoss, dataDir, dataset]
        }
      })

      const untracked = resolve(dvcDemoPath, 'python.py')
      mockGetAllUntracked.resolves(new Set([untracked]))

      mockGetHasChanges.resolves(true)

      const { setScmDecorationStateSpy, setScmStateSpy } =
        await buildRepository(
          disposable,
          internalCommands,
          updatesPaused,
          treeDataChanged
        )

      const modified = makeAbsPathSet(
        dvcDemoPath,
        model,
        logDir,
        logAcc,
        logLoss,
        dataDir,
        dataset
      )

      expect(mockDataStatus).to.be.calledWith(dvcDemoPath)
      expect(mockGetAllUntracked).to.be.calledWith(dvcDemoPath)

      expect(setScmDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        committedUnknown: emptySet,
        notInCache: emptySet,
        tracked: modified,
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: modified,
        uncommittedRenamed: emptySet,
        uncommittedUnknown: emptySet
      })

      expect(setScmStateSpy.lastCall.firstArg).to.deep.equal({
        committed: [],
        notInCache: [],
        uncommitted: [
          {
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, model))
          },
          {
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: true,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, logDir))
          },
          {
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, logAcc))
          },
          {
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, logLoss))
          },
          {
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: true,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, dataDir))
          },
          {
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, dataset))
          }
        ],
        untracked: [
          {
            contextValue: SourceControlDataStatus.UNTRACKED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: false,
            resourceUri: Uri.file(untracked)
          }
        ]
      })
    })
  })

  describe('update', () => {
    it('should update the state and call all dependents', async () => {
      const model = 'model.pkl'
      const dataDir = 'data'
      const features = join(dataDir, 'features')
      const dataXml = join(dataDir, 'data.xml')
      const prepared = join(dataDir, 'prepared')
      const untrackedGo = join('untracked', 'go.go')
      const untrackedPerl = join('untracked', 'perl.pl')
      const untrackedPython = join('untracked', 'python.py')
      const unaddableDotDvc = join(dataDir, 'data.xml.dvc')
      const unaddableDotGitignore = join(dataDir, '.gitignore')

      const {
        internalCommands,
        mockDataStatus,
        mockGetAllUntracked,
        mockGetHasChanges,
        mockNow,
        onDidChangeTreeData,
        updatesPaused,
        treeDataChanged
      } = buildDependencies(disposable)

      mockNow.resolves(FIRST_TRUTHY_TIME)

      const uncommittedDeleted = makeAbsPathSet(dvcDemoPath, model)
      const uncommittedModified = makeAbsPathSet(dvcDemoPath, features)
      const notInCache = makeAbsPathSet(dvcDemoPath, dataXml, prepared)
      const tracked = makeAbsPathSet(
        dvcDemoPath,
        dataDir,
        prepared,
        dataXml,
        features,
        logAcc,
        logDir,
        logLoss,
        model
      )
      const untracked = [
        resolve(dvcDemoPath, untrackedGo),
        resolve(dvcDemoPath, untrackedPerl),
        resolve(dvcDemoPath, untrackedPython)
      ]

      mockDataStatus
        .onFirstCall()
        .resolves({})
        .onSecondCall()
        .resolves({
          committed: {},
          not_in_cache: [dataXml, prepared],
          unchanged: [dataDir, logAcc, logDir, logLoss],
          uncommitted: { deleted: [model], modified: [features] }
        })
      mockGetHasChanges.resolves(false)
      mockGetAllUntracked
        .onFirstCall()
        .resolves(new Set())
        .onSecondCall()
        .resolves(
          new Set([
            ...untracked,
            resolve(dvcDemoPath, unaddableDotDvc),
            resolve(dvcDemoPath, unaddableDotGitignore)
          ])
        )

      const { repository, setScmDecorationStateSpy, setScmStateSpy } =
        await buildRepository(
          disposable,
          internalCommands,
          updatesPaused,
          treeDataChanged
        )

      bypassProcessManagerDebounce(mockNow)

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(onDidChangeTreeData(() => resolve(undefined)))
      )

      expect(setScmDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        committedUnknown: emptySet,
        notInCache: emptySet,
        tracked: emptySet,
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: emptySet,
        uncommittedRenamed: emptySet,
        uncommittedUnknown: emptySet
      })

      expect(setScmStateSpy.lastCall.firstArg).to.deep.equal({
        committed: [],
        notInCache: [],
        uncommitted: [],
        untracked: []
      })

      expect(repository.hasChanges()).to.be.false

      await repository.update()
      await dataUpdateEvent

      expect(mockDataStatus).to.be.calledTwice
      expect(mockGetHasChanges).to.be.calledTwice

      expect(setScmDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        committedUnknown: emptySet,
        notInCache,
        tracked,
        uncommittedAdded: emptySet,
        uncommittedDeleted,
        uncommittedModified,
        uncommittedRenamed: emptySet,
        uncommittedUnknown: emptySet
      })
      expect(setScmStateSpy.lastCall.firstArg).to.deep.equal({
        committed: [],
        notInCache: [...notInCache].map(path => ({
          contextValue: SourceControlDataStatus.NOT_IN_CACHE,
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          isTracked: true,
          resourceUri: Uri.file(path)
        })),
        uncommitted: [
          ...[...uncommittedDeleted].map(path => ({
            contextValue: SourceControlDataStatus.UNCOMMITTED_DELETED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(path)
          })),
          ...[...uncommittedModified].map(path => ({
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(path)
          }))
        ],
        untracked: untracked.map(path => ({
          contextValue: SourceControlDataStatus.UNTRACKED,
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          isTracked: false,
          resourceUri: Uri.file(path)
        }))
      })
      expect(repository.hasChanges()).to.be.true
    })

    it('should handle an error being returned', async () => {
      const {
        internalCommands,
        mockDataStatus,
        mockGetAllUntracked,
        mockGetHasChanges,
        mockNow,
        onDidChangeTreeData,
        updatesPaused,
        treeDataChanged
      } = buildDependencies(disposable)

      mockNow.resolves(FIRST_TRUTHY_TIME)

      const emptySet = new Set<string>()

      const label = './dvc.yaml validation failed.'
      const msg = `'./dvc.yaml' validation failed.

      expected bool, in stages -> train -> outs -> 0 -> model.pt -> checkpoint, line 
      11, column 9
        10 │   - model.pt:                                                            
        11 │   │   checkpoint: true asdasd                                            
        12 │   metrics:                                                               `

      mockDataStatus
        .onFirstCall()
        .resolves({})
        .onSecondCall()
        .resolves({ error: { msg, type: 'Caught error' } })
      mockGetHasChanges.resolves(false)
      mockGetAllUntracked
        .onFirstCall()
        .resolves(emptySet)
        .onSecondCall()
        .resolves(emptySet)

      const {
        repository,
        setErrorDecorationStateSpy,
        setScmDecorationStateSpy,
        setScmStateSpy
      } = await buildRepository(
        disposable,
        internalCommands,
        updatesPaused,
        treeDataChanged
      )

      bypassProcessManagerDebounce(mockNow)

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(onDidChangeTreeData(() => resolve(undefined)))
      )

      await repository.update()
      await dataUpdateEvent

      expect(mockDataStatus).to.be.calledTwice
      expect(mockGetHasChanges).to.be.calledTwice

      expect(setErrorDecorationStateSpy.lastCall.firstArg).to.deep.equal(
        new Set([label])
      )

      expect(setScmDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        committedUnknown: emptySet,
        notInCache: emptySet,
        tracked: emptySet,
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: emptySet,
        uncommittedRenamed: emptySet,
        uncommittedUnknown: emptySet
      })

      expect(setScmStateSpy.lastCall.firstArg).to.deep.equal({
        committed: [],
        notInCache: [],
        uncommitted: [],
        untracked: []
      })

      expect(repository.hasChanges()).to.be.true

      expect(repository.getChildren(dvcDemoPath)).to.deep.equal([
        {
          dvcRoot: dvcDemoPath,
          error: {
            msg,
            uri: Uri.from({
              path: './dvc.yaml validation failed.',
              scheme: 'dvc.tracked'
            })
          },
          isDirectory: false,
          isTracked: false,
          resourceUri: Uri.file(dvcDemoPath)
        }
      ])
    })
  })
})
