import { join } from 'path'
import { Uri } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { RepositoryModel } from '.'
import { dvcDemoPath } from '../../test/util'
import { SourceControlDataStatus } from '../sourceControlManagement'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

const mockedDisposable = jest.mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('RepositoryModel', () => {
  const emptySet = new Set()

  describe('transformAndSet', () => {
    it('should correctly process the output of data status', () => {
      const deleted = join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte')
      const logDir = 'logs'
      const scalarDir = join(logDir, 'scalar')
      const logAcc = join(scalarDir, 'acc.tsv')
      const logLoss = join(scalarDir, 'loss.tsv')
      const output = 'model.pt'
      const predictions = 'predictions.json'
      const rawDataDir = join('data', 'MNIST', 'raw')
      const renamed = join('data', 'MNIST', 'raw', 'train-lulbels-idx9-ubyte')

      const dataStatus = {
        committed: {
          deleted: [deleted],
          modified: [output],
          renamed: [{ new: renamed, old: 'does not matter' }]
        },
        not_in_cache: [],
        unchanged: [predictions],
        uncommitted: {
          modified: [rawDataDir, logDir, scalarDir, logAcc, logLoss]
        },
        untracked: []
      }

      const model = new RepositoryModel(dvcDemoPath)
      const { decorationState, sourceControlManagementState } =
        model.transformAndSet({
          dataStatus,
          hasGitChanges: true,
          untracked: new Set()
        })

      expect(decorationState).toStrictEqual({
        committedAdded: emptySet,
        committedDeleted: new Set([join(dvcDemoPath, deleted)]),
        committedModified: new Set([join(dvcDemoPath, output)]),
        committedRenamed: new Set([join(dvcDemoPath, renamed)]),
        notInCache: emptySet,
        tracked: new Set(
          [
            predictions,
            deleted,
            output,
            renamed,
            rawDataDir,
            logDir,
            scalarDir,
            logAcc,
            logLoss
          ].map(path => join(dvcDemoPath, path))
        ),
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: new Set([
          join(dvcDemoPath, rawDataDir),
          join(dvcDemoPath, logDir),
          join(dvcDemoPath, scalarDir),
          join(dvcDemoPath, logAcc),
          join(dvcDemoPath, logLoss)
        ]),
        uncommittedRenamed: emptySet
      })

      expect(sourceControlManagementState).toStrictEqual({
        committed: [
          {
            contextValue: SourceControlDataStatus.COMMITTED_DELETED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, deleted))
          },
          {
            contextValue: SourceControlDataStatus.COMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, output))
          },
          {
            contextValue: SourceControlDataStatus.COMMITTED_RENAMED,
            dvcRoot: dvcDemoPath,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, renamed))
          }
        ],
        notInCache: [],
        uncommitted: [rawDataDir, logDir, scalarDir, logAcc, logLoss].map(
          path => ({
            contextValue: SourceControlDataStatus.UNCOMMITTED_MODIFIED,
            dvcRoot: dvcDemoPath,
            isDirectory: [rawDataDir, logDir, scalarDir].includes(path),
            isTracked: true,
            resourceUri: Uri.file(join(dvcDemoPath, path))
          })
        ),
        untracked: []
      })
    })

    it('should handle data status output which only has unchanged paths', () => {
      const rawDataDir = join('data', 'MNIST', 'raw')
      const data = join(rawDataDir, 'train-labels-idx2-ubyte')

      const dataStatus = {
        unchanged: [rawDataDir, data]
      }

      const model = new RepositoryModel(dvcDemoPath)
      const { decorationState, sourceControlManagementState } =
        model.transformAndSet({
          dataStatus,
          hasGitChanges: true,
          untracked: new Set()
        })

      expect(decorationState).toStrictEqual({
        committedAdded: emptySet,
        committedDeleted: emptySet,
        committedModified: emptySet,
        committedRenamed: emptySet,
        notInCache: emptySet,
        tracked: new Set([
          join(dvcDemoPath, rawDataDir),
          join(dvcDemoPath, data)
        ]),
        uncommittedAdded: emptySet,
        uncommittedDeleted: emptySet,
        uncommittedModified: emptySet,
        uncommittedRenamed: emptySet
      })

      expect(sourceControlManagementState).toStrictEqual({
        committed: [],
        notInCache: [],
        uncommitted: [],
        untracked: []
      })
    })
  })
})
