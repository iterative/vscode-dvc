import { join } from 'path'
import { EventEmitter, commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import { ensureDirSync } from 'fs-extra'
import * as FileSystem from '../../../fileSystem'
import { Setup } from '../../../setup'
import * as Runner from '../../../setup/runner'
import * as WorkspaceFolders from '../../../vscode/workspaceFolders'
import { buildDependencies, mockDisposable } from '../util'
import * as AutoInstall from '../../../setup/autoInstall'
import { DvcReader } from '../../../cli/dvc/reader'
import { DvcExecutor } from '../../../cli/dvc/executor'
import { GitReader } from '../../../cli/git/reader'
import { GitExecutor } from '../../../cli/git/executor'
import { InternalCommands } from '../../../commands/internal'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { DvcRunner } from '../../../cli/dvc/runner'
import { StopWatch } from '../../../util/time'
import { WorkspaceScale } from '../../../telemetry/collect'
import { dvcDemoPath } from '../../util'
import { Config } from '../../../config'
import { Resource } from '../../../resourceLocator'

export const TEMP_DIR = join(dvcDemoPath, 'temp-empty-watcher-dir')

const buildSetupDependencies = (
  disposer: Disposer,
  mockDvcRoot: string | undefined,
  mockGitRoot: string | undefined
) => {
  const mockEmitter = disposer.track(new EventEmitter())
  const mockEvent = mockEmitter.event

  const mockRoot = stub().resolves(mockDvcRoot)
  const mockVersion = stub().resolves(undefined)
  const mockGetGitRepositoryRoot = stub().resolves(mockGitRoot)

  const mockInitializeDvc = fake()
  const mockInitializeGit = fake()
  stub(commands, 'registerCommand').returns(mockDisposable)

  return {
    mockDvcExecutor: {
      init: mockInitializeDvc,
      onDidCompleteProcess: mockEvent,
      onDidStartProcess: mockEvent
    } as unknown as DvcExecutor,
    mockDvcReader: {
      onDidCompleteProcess: mockEvent,
      onDidStartProcess: mockEvent,
      root: mockRoot,
      version: mockVersion
    } as unknown as DvcReader,
    mockDvcRunner: {
      onDidCompleteProcess: mockEvent,
      onDidStartProcess: mockEvent
    } as DvcRunner,
    mockEmitter,
    mockExecuteCommand: stub(commands, 'executeCommand'),
    mockGetGitRepositoryRoot,
    mockGitExecutor: {
      init: mockInitializeGit,
      onDidCompleteProcess: mockEvent,
      onDidStartProcess: mockEvent
    } as unknown as GitExecutor,
    mockGitReader: {
      getGitRepositoryRoot: mockGetGitRepositoryRoot,
      onDidCompleteProcess: mockEvent,
      onDidStartProcess: mockEvent
    } as unknown as GitReader,
    mockInitializeDvc,
    mockInitializeGit,
    mockInternalCommands: {
      registerExternalCliCommand: stub(),
      registerExternalCommand: stub()
    } as unknown as InternalCommands,
    mockRoot,
    mockRunSetup: stub(Runner, 'run').resolves(undefined),
    mockRunSetupWithGlobalRecheck: stub(
      Runner,
      'runWithGlobalRecheck'
    ).resolves(undefined),
    mockVersion
  }
}

export const buildSetup = (
  disposer: Disposer,
  hasData = false,
  noDvcRoot = true,
  noGitRoot = true
) => {
  const { config, messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockDvcRoot = noDvcRoot ? undefined : dvcDemoPath
  const mockGitRoot = noGitRoot ? undefined : dvcDemoPath

  const {
    mockDvcExecutor,
    mockDvcReader,
    mockDvcRunner,
    mockExecuteCommand,
    mockGitExecutor,
    mockGitReader,
    mockEmitter,
    mockGetGitRepositoryRoot,
    mockInitializeDvc,
    mockInitializeGit,
    mockInternalCommands,
    mockRunSetup,
    mockVersion
  } = buildSetupDependencies(disposer, mockDvcRoot, mockGitRoot)
  stub(FileSystem, 'findDvcRootPaths').resolves(
    [mockDvcRoot].filter(Boolean) as string[]
  )

  const mockAutoInstallDvc = stub(AutoInstall, 'autoInstallDvc')
  stub(AutoInstall, 'findPythonBinForInstall').resolves(undefined)

  const mockOpenExperiments = fake()

  const setup = disposer.track(
    new Setup(
      new StopWatch(),
      config,
      mockDvcExecutor,
      mockDvcReader,
      mockDvcRunner,
      mockGitExecutor,
      mockGitReader,
      () => Promise.resolve([undefined]),
      () => Promise.resolve(undefined),
      {
        columnsChanged: mockEmitter,
        getHasData: () => hasData,
        showWebview: mockOpenExperiments
      } as unknown as WorkspaceExperiments,
      mockInternalCommands,
      resourceLocator.dvcIcon,
      () => Promise.resolve({} as WorkspaceScale)
    )
  )

  return {
    config,
    messageSpy,
    mockAutoInstallDvc,
    mockExecuteCommand,
    mockGetGitRepositoryRoot,
    mockInitializeDvc,
    mockInitializeGit,
    mockOpenExperiments,
    mockRunSetup,
    mockVersion,
    resourceLocator,
    setup
  }
}

export const buildSetupWithWatchers = async (disposer: Disposer) => {
  const {
    mockDvcExecutor,
    mockDvcReader,
    mockDvcRunner,
    mockEmitter,
    mockGitExecutor,
    mockGitReader,
    mockInternalCommands,
    mockRunSetup
  } = buildSetupDependencies(disposer, undefined, undefined)

  const config = disposer.track(new Config())

  await config.isReady()

  ensureDirSync(TEMP_DIR)

  stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(TEMP_DIR)

  const setup = disposer.track(
    new Setup(
      new StopWatch(),
      config,
      mockDvcExecutor,
      mockDvcReader,
      mockDvcRunner,
      mockGitExecutor,
      mockGitReader,
      () => Promise.resolve([undefined]),
      () => Promise.resolve(undefined),
      {
        columnsChanged: mockEmitter,
        getHasData: () => false,
        showWebview: fake()
      } as unknown as WorkspaceExperiments,
      mockInternalCommands,
      {} as Resource,
      () => Promise.resolve({} as WorkspaceScale)
    )
  )
  return {
    config,
    mockRunSetup,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDidChangeWorkspace: (setup as any).onDidChangeWorkspace,
    setup
  }
}
