import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { dvcDemoPath } from '../../util'
import {
  buildInternalCommands,
  FIRST_TRUTHY_TIME,
  SafeWatcherDisposer,
  spyOnPrivateMemberMethod
} from '../util'
import { Disposer } from '../../../extension'
import { RepositoryData } from '../../../repository/data'
import * as Time from '../../../util/time'
import * as Watcher from '../../../fileSystem/watcher'
import { Repository } from '../../../repository'
import { InternalCommands } from '../../../commands/internal'

export const buildDependencies = (disposer: Disposer) => {
  const { dvcReader, gitReader, internalCommands } =
    buildInternalCommands(disposer)

  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(undefined)

  const mockDataStatus = stub(dvcReader, 'dataStatus')
  const mockGetAllUntracked = stub(gitReader, 'listUntracked')
  const mockGetHasChanges = stub(gitReader, 'hasChanges')

  const mockNow = stub(Time, 'getCurrentEpoch')

  const treeDataChanged = disposer.track(new EventEmitter<void>())
  const onDidChangeTreeData = treeDataChanged.event

  return {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDataStatus,
    mockGetAllUntracked,
    mockGetHasChanges,
    mockNow,
    onDidChangeTreeData,
    treeDataChanged
  }
}

export const buildRepositoryData = async (disposer: SafeWatcherDisposer) => {
  const {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDataStatus,
    mockGetAllUntracked,
    mockNow
  } = buildDependencies(disposer)

  mockDataStatus.resolves({})
  mockGetAllUntracked.resolves(new Set())
  mockNow.returns(FIRST_TRUTHY_TIME)

  const data = disposer.track(
    new RepositoryData(dvcDemoPath, internalCommands, [])
  )
  await data.isReady()

  mockDataStatus.resetHistory()

  return {
    data,
    mockCreateFileSystemWatcher,
    mockDataStatus,
    mockGetAllUntracked
  }
}

export const buildRepository = async (
  disposer: SafeWatcherDisposer,
  internalCommands: InternalCommands,
  treeDataChanged: EventEmitter<void>,
  dvcRoot = dvcDemoPath
) => {
  const repository = disposer.track(
    new Repository(dvcRoot, internalCommands, treeDataChanged, [])
  )

  const setErrorDecorationStateSpy = spyOnPrivateMemberMethod(
    repository,
    'errorDecorationProvider',
    'setState'
  )
  const setScmDecorationStateSpy = spyOnPrivateMemberMethod(
    repository,
    'scmDecorationProvider',
    'setState'
  )
  const setScmStateSpy = spyOnPrivateMemberMethod(
    repository,
    'sourceControlManagement',
    'setState'
  )

  await repository.isReady()
  return {
    repository,
    setErrorDecorationStateSpy,
    setScmDecorationStateSpy,
    setScmStateSpy
  }
}
