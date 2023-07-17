import { join } from 'path'
import { EventEmitter, commands, env } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import { ensureDirSync } from 'fs-extra'
import * as FileSystem from '../../../fileSystem'
import { Setup } from '../../../setup'
import * as Runner from '../../../setup/runner'
import * as WorkspaceFolders from '../../../vscode/workspaceFolders'
import { buildDependencies } from '../util'
import * as AutoInstall from '../../../setup/autoInstall'
import { InternalCommands } from '../../../commands/internal'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { StopWatch } from '../../../util/time'
import { WorkspaceScale } from '../../../telemetry/collect'
import { dvcDemoPath } from '../../util'
import { Config } from '../../../config'
import { Resource } from '../../../resourceLocator'
import { MIN_CLI_VERSION } from '../../../cli/dvc/contract'
import { Status } from '../../../status'

export const TEMP_DIR = join(dvcDemoPath, 'temp-empty-watcher-dir')

export const buildSetup = ({
  disposer,
  cliError = undefined,
  gitVersion,
  hasData = false,
  noDvcRoot = true,
  noGitCommits = true,
  noGitRoot = true
}: {
  cliError?: undefined
  disposer: Disposer
  gitVersion?: string | null
  hasData?: boolean
  noDvcRoot?: boolean
  noGitCommits?: boolean
  noGitRoot?: boolean
}) => {
  const {
    config,
    messageSpy,
    resourceLocator,
    internalCommands,
    dvcConfig,
    dvcReader,
    gitExecutor,
    gitReader
  } = buildDependencies({ disposer })

  if (gitVersion === undefined) {
    gitVersion = 'git version 2.41.0'
  }
  if (gitVersion === null) {
    gitVersion = undefined
  }

  const mockDvcRoot = noDvcRoot ? undefined : dvcDemoPath
  const mockGitRoot = noGitRoot ? undefined : dvcDemoPath

  const mockEmitter = disposer.track(new EventEmitter())
  stub(dvcReader, 'root').resolves(mockDvcRoot)
  const mockRemote = stub(dvcConfig, 'remote').resolves('')
  const mockVersion = stub(dvcReader, 'version').resolves(MIN_CLI_VERSION)
  const mockGlobalVersion = stub(dvcReader, 'globalVersion').resolves(
    MIN_CLI_VERSION
  )
  const mockGetGitRepositoryRoot = stub(
    gitReader,
    'getGitRepositoryRoot'
  ).resolves(mockGitRoot)

  const mockGitVersion = stub(gitReader, 'gitVersion').resolves(gitVersion)

  stub(gitReader, 'hasNoCommits').resolves(noGitCommits)

  const mockInitializeGit = stub(gitExecutor, 'gitInit')

  stub(FileSystem, 'findDvcRootPaths').resolves(
    [mockDvcRoot].filter(Boolean) as string[]
  )

  const mockAutoInstallDvc = stub(AutoInstall, 'autoInstallDvc')
  const mockAutoUpgradeDvc = stub(AutoInstall, 'autoUpgradeDvc')
  stub(AutoInstall, 'findPythonBinForInstall').resolves(undefined)

  const mockShowWebview = stub(WorkspaceExperiments.prototype, 'showWebview')

  const mockRunSetup = stub(Runner, 'run').resolves(undefined)

  const mockExecuteCommand = stub(commands, 'executeCommand').resolves(
    undefined
  )

  const mockOpenExternal = stub(env, 'openExternal')
  const urlOpenedEvent = new Promise(resolve =>
    mockOpenExternal.callsFake(() => {
      resolve(undefined)
      return Promise.resolve(true)
    })
  )

  const mockConfig = stub(dvcConfig, 'config').resolves('')

  const setup = disposer.track(
    new Setup(
      config,
      internalCommands,
      {
        columnsChanged: mockEmitter,
        getCliError: () => cliError,
        getHasData: () => hasData,
        showWebview: mockShowWebview
      } as unknown as WorkspaceExperiments,
      { setAvailability: stub() } as unknown as Status,
      resourceLocator.dvcIcon,
      new StopWatch(),
      () => Promise.resolve([undefined]),
      () => undefined,
      () => Promise.resolve({} as WorkspaceScale)
    )
  )

  return {
    config,
    internalCommands,
    messageSpy,
    mockAutoInstallDvc,
    mockAutoUpgradeDvc,
    mockConfig,
    mockExecuteCommand,
    mockGetGitRepositoryRoot,
    mockGitVersion,
    mockGlobalVersion,
    mockInitializeGit,
    mockOpenExternal,
    mockRemote,
    mockRunSetup,
    mockShowWebview,
    mockVersion,
    resourceLocator,
    setup,
    urlOpenedEvent
  }
}

export const buildSetupWithWatchers = async (disposer: Disposer) => {
  const mockEmitter = disposer.track(new EventEmitter())
  const mockInternalCommands = {
    executeCommand: stub(),
    registerExternalCliCommand: stub(),
    registerExternalCommand: stub()
  } as unknown as InternalCommands
  const mockRunSetup = stub(Runner, 'run').resolves(undefined)

  const config = disposer.track(new Config())

  await config.isReady()

  ensureDirSync(TEMP_DIR)

  stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(TEMP_DIR)

  const setup = disposer.track(
    new Setup(
      config,
      mockInternalCommands,
      {
        columnsChanged: mockEmitter,
        getHasData: () => false,
        showWebview: fake()
      } as unknown as WorkspaceExperiments,
      {} as Status,
      {} as Resource,
      new StopWatch(),
      () => Promise.resolve([undefined]),
      () => undefined,
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
