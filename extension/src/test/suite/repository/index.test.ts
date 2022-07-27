import { join, resolve } from 'path'
import { Uri } from 'vscode'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore } from 'sinon'
import { buildDependencies, buildRepository } from './util'
import { Disposable } from '../../../extension'
import { dvcDemoPath } from '../../util'
import { bypassProcessManagerDebounce, FIRST_TRUTHY_TIME } from '../util'
import { SourceControlManagementStatus } from '../../../repository/sourceControlManagement'

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

      const { setDecorationStateSpy, setScmStateSpy } = await buildRepository(
        disposable,
        internalCommands,
        updatesPaused,
        treeDataChanged
      )

      const modified = new Set([
        resolve(dvcDemoPath, model),
        resolve(dvcDemoPath, logDir),
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, dataDir),
        resolve(dvcDemoPath, dataset)
      ])

      expect(mockDataStatus).to.be.calledWith(dvcDemoPath)
      expect(mockGetAllUntracked).to.be.calledWith(dvcDemoPath)

      expect(setDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        notInCache: emptySet,
        tracked: modified,
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: modified,
        uncommittedRenamed: emptySet
      })

      expect(setScmStateSpy.lastCall.firstArg).to.deep.equal({
        committed: [],
        notInCache: [],
        uncommitted: [
          {
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, model))
          },
          {
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: true,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, logDir))
          },
          {
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, logAcc))
          },
          {
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, logLoss))
          },
          {
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: true,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, dataDir))
          },
          {
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, dataset))
          }
        ],
        untracked: [
          {
            contextValue: SourceControlManagementStatus.UNTRACKED,
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

      const uncommittedDeleted = new Set([join(dvcDemoPath, model)])
      const uncommittedModified = new Set([join(dvcDemoPath, features)])
      const notInCache = new Set([
        join(dvcDemoPath, dataXml),
        join(dvcDemoPath, prepared)
      ])
      const tracked = new Set([
        resolve(dvcDemoPath, dataDir),
        resolve(dvcDemoPath, prepared),
        resolve(dvcDemoPath, dataXml),
        resolve(dvcDemoPath, features),
        resolve(dvcDemoPath, logAcc),
        resolve(dvcDemoPath, logDir),
        resolve(dvcDemoPath, logLoss),
        resolve(dvcDemoPath, model)
      ])
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
        .resolves(new Set(untracked))

      const { repository, setDecorationStateSpy, setScmStateSpy } =
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

      expect(setDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        notInCache: emptySet,
        tracked: emptySet,
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: emptySet,
        uncommittedRenamed: emptySet
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

      expect(setDecorationStateSpy.lastCall.firstArg).to.deep.equal({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        notInCache,
        tracked,
        uncommittedAdded: emptySet,
        uncommittedDeleted,
        uncommittedModified,
        uncommittedRenamed: emptySet
      })
      expect(setScmStateSpy.lastCall.firstArg).to.deep.equal({
        committed: [],
        notInCache: [...notInCache].map(path => ({
          contextValue: SourceControlManagementStatus.NOT_IN_CACHE,
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          isTracked: true,
          resourceUri: Uri.file(path)
        })),
        uncommitted: [
          ...[...uncommittedDeleted].map(path => ({
            contextValue: SourceControlManagementStatus.UNCOMMITTED_DELETED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(path)
          })),
          ...[...uncommittedModified].map(path => ({
            contextValue: SourceControlManagementStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(path)
          }))
        ],
        untracked: untracked.map(path => ({
          contextValue: SourceControlManagementStatus.UNTRACKED,
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          isTracked: false,
          resourceUri: Uri.file(path)
        }))
      })
      expect(repository.hasChanges()).to.be.true
    })
  })
})
