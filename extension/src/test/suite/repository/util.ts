import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { dvcDemoPath } from '../../util'
import {
  buildInternalCommands,
  FIRST_TRUTHY_TIME,
  mockDisposable,
  spyOnPrivateMemberMethod
} from '../util'
import { Disposer } from '../../../extension'
import { RepositoryData } from '../../../repository/data'
import * as Time from '../../../util/time'
import * as Watcher from '../../../fileSystem/watcher'
import { Repository } from '../../../repository'
import { InternalCommands } from '../../../commands/internal'
import { DataStatusOutput } from '../../../cli/dvc/reader'

export const buildDependencies = (disposer: Disposer) => {
  const { dvcReader, gitReader, internalCommands } =
    buildInternalCommands(disposer)

  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(mockDisposable)

  const mockDataStatus = stub(dvcReader, 'dataStatus')
  const mockGetAllUntracked = stub(gitReader, 'listUntracked')
  const mockGetHasChanges = stub(gitReader, 'hasChanges')

  const mockNow = stub(Time, 'getCurrentEpoch')

  const treeDataChanged = disposer.track(new EventEmitter<void>())
  const onDidChangeTreeData = treeDataChanged.event
  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  return {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDataStatus,
    mockGetAllUntracked,
    mockGetHasChanges,
    mockNow,
    onDidChangeTreeData,
    treeDataChanged,
    updatesPaused
  }
}

export const buildRepositoryData = async (disposer: Disposer) => {
  const {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDataStatus,
    mockGetAllUntracked,
    mockNow,
    updatesPaused
  } = buildDependencies(disposer)

  mockDataStatus.resolves({} as DataStatusOutput)
  mockGetAllUntracked.resolves(new Set())
  mockNow.returns(FIRST_TRUTHY_TIME)

  const data = disposer.track(
    new RepositoryData(dvcDemoPath, internalCommands, updatesPaused)
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
  disposer: Disposer,
  internalCommands: InternalCommands,
  updatesPaused: EventEmitter<boolean>,
  treeDataChanged: EventEmitter<void>,
  dvcRoot = dvcDemoPath
) => {
  const repository = disposer.track(
    new Repository(dvcRoot, internalCommands, updatesPaused, treeDataChanged)
  )

  const setDecorationStateSpy = spyOnPrivateMemberMethod(
    repository,
    'decorationProvider',
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
    setDecorationStateSpy,
    setScmStateSpy
  }
}
