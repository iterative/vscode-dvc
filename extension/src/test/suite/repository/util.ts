import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { dvcDemoPath } from '../util'
import { CliReader } from '../../../cli/reader'
import { InternalCommands } from '../../../commands/internal'
import { Config } from '../../../config'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import { RepositoryData } from '../../../repository/data'
import { DecorationProvider } from '../../../repository/decorationProvider'
import * as Time from '../../../util/time'
import { OutputChannel } from '../../../vscode/outputChannel'

export const buildDependencies = (disposer: Disposer) => {
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))
  const mockListDvcOnlyRecursive = stub(cliReader, 'listDvcOnlyRecursive')
  const mockStatus = stub(cliReader, 'status')
  const mockDiff = stub(cliReader, 'diff')
  const mockGetAllUntracked = stub(Git, 'getAllUntracked')
  const mockNow = stub(Time, 'getCurrentEpoch')

  const outputChannel = disposer.track(
    new OutputChannel([cliReader], '8', 'repository test suite')
  )
  const internalCommands = disposer.track(
    new InternalCommands(config, outputChannel, cliReader)
  )
  const decorationProvider = disposer.track(new DecorationProvider())
  const treeDataChanged = disposer.track(new EventEmitter<void>())
  const onDidChangeTreeData = treeDataChanged.event

  return {
    decorationProvider,
    internalCommands,
    mockDiff,
    mockGetAllUntracked,
    mockListDvcOnlyRecursive,
    mockNow,
    mockStatus,
    onDidChangeTreeData,
    treeDataChanged
  }
}

export const buildRepositoryData = async (disposer: Disposer) => {
  const {
    internalCommands,
    mockDiff,
    mockGetAllUntracked,
    mockListDvcOnlyRecursive,
    mockNow,
    mockStatus
  } = buildDependencies(disposer)

  mockDiff.resolves({})
  mockGetAllUntracked.resolves(new Set())
  mockListDvcOnlyRecursive.resolves([])
  mockNow.returns(150)
  mockStatus.resolves({})

  const data = disposer.track(new RepositoryData(dvcDemoPath, internalCommands))
  await data.isReady()

  mockDiff.resetHistory()
  mockGetAllUntracked.resetHistory()
  mockListDvcOnlyRecursive.resetHistory()
  mockStatus.resetHistory()

  return {
    data,
    mockDiff,
    mockGetAllUntracked,
    mockListDvcOnlyRecursive,
    mockStatus
  }
}
