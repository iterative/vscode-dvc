import { EventEmitter, commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import * as FileSystem from '../../../fileSystem'
import { Setup } from '../../../setup/index'
import * as RunSetup from '../../../setup'
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

export const buildSetup = (
  disposer: Disposer,
  hasData = false,
  noDvcRoot = true,
  noGitRoot = true
) => {
  const { config, messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockDvcRoot = noDvcRoot ? undefined : dvcDemoPath
  const mockGitRoot = noGitRoot ? undefined : dvcDemoPath

  const mockEmitter = disposer.track(new EventEmitter())
  const mockEvent = mockEmitter.event

  const mockGetGitRepositoryRoot = stub().resolves(mockGitRoot)
  const mockInitializeDvc = fake()
  const mockInitializeGit = fake()
  const mockOpenExperiments = fake()
  const mockRoot = stub().resolves(mockDvcRoot)
  stub(FileSystem, 'findDvcRootPaths').resolves(
    [mockDvcRoot].filter(Boolean) as string[]
  )

  const mockExecuteCommand = stub(commands, 'executeCommand')

  const mockAutoInstallDvc = stub(AutoInstall, 'autoInstallDvc')
  stub(AutoInstall, 'findPythonBinForInstall').resolves(undefined)
  stub(commands, 'registerCommand').returns(mockDisposable)
  stub(RunSetup, 'setup').resolves(undefined)
  stub(RunSetup, 'setupWithGlobalRecheck').resolves(undefined)

  const setup = disposer.track(
    new Setup(
      new StopWatch(),
      config,
      {
        init: mockInitializeDvc,
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as unknown as DvcExecutor,
      {
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent,
        root: mockRoot
      } as unknown as DvcReader,
      {
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as DvcRunner,
      {
        init: mockInitializeGit,
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as unknown as GitExecutor,
      {
        getGitRepositoryRoot: mockGetGitRepositoryRoot,
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as unknown as GitReader,
      () => Promise.resolve([undefined]),
      () => Promise.resolve(undefined),
      {
        columnsChanged: mockEmitter,
        getHasData: () => hasData,
        showWebview: mockOpenExperiments
      } as unknown as WorkspaceExperiments,
      {
        registerExternalCliCommand: stub(),
        registerExternalCommand: stub()
      } as unknown as InternalCommands,
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
    resourceLocator,
    setup
  }
}
