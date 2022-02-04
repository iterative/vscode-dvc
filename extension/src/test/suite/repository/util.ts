import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { dvcDemoPath } from '../../util'
import {
  buildInternalCommands,
  FIRST_TRUTHY_TIME,
  mockDisposable
} from '../util'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import { RepositoryData } from '../../../repository/data'
import * as Time from '../../../util/time'
import * as Watcher from '../../../fileSystem/watcher'

export const buildDependencies = (disposer: Disposer) => {
  const { cliReader, internalCommands } = buildInternalCommands(disposer)

  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(mockDisposable)

  const mockListDvcOnlyRecursive = stub(cliReader, 'listDvcOnlyRecursive')
  const mockStatus = stub(cliReader, 'status')
  const mockDiff = stub(cliReader, 'diff')
  const mockGetAllUntracked = stub(Git, 'getAllUntracked')
  const mockNow = stub(Time, 'getCurrentEpoch')

  const treeDataChanged = disposer.track(new EventEmitter<void>())
  const onDidChangeTreeData = treeDataChanged.event
  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  return {
    internalCommands,
    mockCreateFileSystemWatcher,
    mockDiff,
    mockGetAllUntracked,
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
