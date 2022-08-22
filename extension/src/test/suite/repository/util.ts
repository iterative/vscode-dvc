import { spy, stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { dvcDemoPath } from '../../util'
import {
  buildInternalCommands,
  FIRST_TRUTHY_TIME,
  mockDisposable
} from '../util'
import { Disposer } from '../../../extension'
import { RepositoryData } from '../../../repository/data'
import * as Time from '../../../util/time'
import * as Watcher from '../../../fileSystem/watcher'
import { Repository } from '../../../repository'
import { InternalCommands } from '../../../commands/internal'
import { DecorationProvider } from '../../../repository/decorationProvider'
import { SourceControlManagement } from '../../../repository/sourceControlManagement'

export const buildDependencies = (disposer: Disposer) => {
  const { cliReader, gitReader, internalCommands } =
    buildInternalCommands(disposer)

  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(mockDisposable)

  const mockListDvcOnlyRecursive = stub(cliReader, 'listDvcOnlyRecursive')
  const mockStatus = stub(cliReader, 'status')
  const mockDiff = stub(cliReader, 'diff')
  const mockGetAllUntracked = stub(gitReader, 'listUntracked')
  const mockGetHasChanges = stub(gitReader, 'hasChanges')
  const mockNow = stub(Time, 'getCurrentEpoch')

  const treeDataChanged = disposer.track(new EventEmitter<void>())
  const onDidChangeTreeData = treeDataChanged.event
  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  return {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDiff,
    mockGetAllUntracked,
    mockGetHasChanges,
    mockListDvcOnlyRecursive,
    mockNow,
    mockStatus,
    onDidChangeTreeData,
    treeDataChanged,
    updatesPaused
  }
}

export const buildRepositoryData = async (disposer: Disposer) => {
  const {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDiff,
    mockGetAllUntracked,
    mockListDvcOnlyRecursive,
    mockNow,
    mockStatus,
    updatesPaused
  } = buildDependencies(disposer)

  mockDiff.resolves({})
  mockGetAllUntracked.resolves(new Set())
  mockListDvcOnlyRecursive.resolves([])
  mockNow.returns(FIRST_TRUTHY_TIME)
  mockStatus.resolves({})

  const data = disposer.track(
    new RepositoryData(dvcDemoPath, internalCommands, updatesPaused)
  )
  await data.isReady()

  mockDiff.resetHistory()
  mockGetAllUntracked.resetHistory()
  mockListDvcOnlyRecursive.resetHistory()
  mockStatus.resetHistory()

  return {
    data,
    mockCreateFileSystemWatcher,
    mockDiff,
    mockGetAllUntracked,
    mockListDvcOnlyRecursive,
    mockStatus
  }
}

export const buildRepository = async (
  disposer: Disposer,
  internalCommands: InternalCommands,
  updatesPaused: EventEmitter<boolean>,
  treeDataChanged: EventEmitter<void>,
  dvcRoot = dvcDemoPath
) => {
  const repository = disposer.track(
    new Repository(dvcRoot, internalCommands, updatesPaused, treeDataChanged)
  )

  const setDecorationStateSpy = spy(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (repository as any).decorationProvider as DecorationProvider,
    'setState'
  )
  const setScmStateSpy = spy(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (repository as any).sourceControlManagement as SourceControlManagement,
    'setState'
  )

  await repository.isReady()
  return {
    repository,
    setDecorationStateSpy,
    setScmStateSpy
  }
}
