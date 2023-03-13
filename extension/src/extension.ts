import {
  commands,
  env,
  EventEmitter,
  ExtensionContext,
  ViewColumn
} from 'vscode'
import { DvcExecutor } from './cli/dvc/executor'
import { DvcRunner } from './cli/dvc/runner'
import { DvcReader } from './cli/dvc/reader'
import { Config } from './config'
import { Context } from './context'
import { WorkspaceExperiments } from './experiments/workspace'
import { registerExperimentCommands } from './experiments/commands/register'
import { registerPlotsCommands } from './plots/commands/register'
import { RepositoriesTree } from './repository/model/tree'
import { registerRepositoryCommands } from './repository/commands/register'
import { ResourceLocator } from './resourceLocator'
import { reRegisterVsCodeCommands } from './vscode/commands'
import { InternalCommands } from './commands/internal'
import { ExperimentsColumnsTree } from './experiments/columns/tree'
import { ExperimentsSortByTree } from './experiments/model/sortBy/tree'
import { ExperimentsTree } from './experiments/model/tree'
import { ExperimentsFilterByTree } from './experiments/model/filterBy/tree'
import {
  Context as VsCodeContext,
  getDvcRootFromContext
} from './vscode/context'
import { OutputChannel } from './vscode/outputChannel'
import {
  getTelemetryReporter,
  sendTelemetryEvent,
  sendTelemetryEventAndThrow
} from './telemetry'
import { RegisteredCommands } from './commands/external'
import { StopWatch } from './util/time'
import {
  registerWalkthroughCommands,
  showWalkthroughOnFirstUse
} from './vscode/walkthrough'
import { WorkspaceRepositories } from './repository/workspace'
import { recommendRedHatExtensionOnce } from './vscode/recommend'
import { WorkspacePlots } from './plots/workspace'
import { PlotsPathsTree } from './plots/paths/tree'
import { Disposable } from './class/dispose'
import { collectWorkspaceScale } from './telemetry/collect'
import { GitExecutor } from './cli/git/executor'
import { GitReader } from './cli/git/reader'
import { Setup } from './setup'
import { definedAndNonEmpty } from './util/array'
import { stopProcesses } from './process/execution'
import { Flag } from './cli/dvc/constants'
import { LanguageClient } from './languageClient'
import { collectRunningExperimentPids } from './experiments/processExecution/collect'
import { registerPatchCommand } from './patch'
import { DvcViewer } from './cli/dvc/viewer'
import { registerSetupCommands } from './setup/register'
import { Status } from './status'
import { registerPersistenceCommands } from './persistence/register'

export class Extension extends Disposable {
  protected readonly internalCommands: InternalCommands

  private readonly resourceLocator: ResourceLocator
  private readonly repositories: WorkspaceRepositories
  private readonly experiments: WorkspaceExperiments
  private readonly plots: WorkspacePlots
  private readonly setup: Setup
  private readonly repositoriesTree: RepositoriesTree
  private readonly dvcExecutor: DvcExecutor
  private readonly dvcReader: DvcReader
  private readonly dvcRunner: DvcRunner
  private readonly dvcViewer: DvcViewer
  private readonly gitExecutor: GitExecutor
  private readonly gitReader: GitReader

  private updatesPaused: EventEmitter<boolean> = this.dispose.track(
    new EventEmitter<boolean>()
  )

  constructor(context: ExtensionContext) {
    super()

    const stopWatch = new StopWatch()

    this.dispose.track(getTelemetryReporter())

    this.resourceLocator = this.dispose.track(
      new ResourceLocator(context.extensionUri)
    )

    const config = this.dispose.track(new Config())

    this.gitExecutor = this.dispose.track(new GitExecutor())
    this.gitReader = this.dispose.track(new GitReader())

    const getStudioLiveShareToken = () => this.setup.getStudioLiveShareToken()

    this.dvcExecutor = this.dispose.track(
      new DvcExecutor(config, getStudioLiveShareToken, cwd =>
        this.gitReader.getRemoteUrl(cwd)
      )
    )

    this.dvcReader = this.dispose.track(new DvcReader(config))
    this.dvcRunner = this.dispose.track(
      new DvcRunner(config, getStudioLiveShareToken)
    )
    this.dvcViewer = this.dispose.track(new DvcViewer(config))

    const clis = [
      this.dvcExecutor,
      this.dvcReader,
      this.dvcRunner,
      this.dvcViewer,
      this.gitExecutor,
      this.gitReader
    ]

    const outputChannel = this.dispose.track(
      new OutputChannel(
        clis,
        (context.extension.packageJSON as { version: string }).version
      )
    )

    this.internalCommands = this.dispose.track(
      new InternalCommands(outputChannel, ...clis)
    )

    const status = this.dispose.track(new Status(config, ...clis))

    this.experiments = this.dispose.track(
      new WorkspaceExperiments(
        this.internalCommands,
        this.updatesPaused,
        context.workspaceState
      )
    )

    this.plots = this.dispose.track(
      new WorkspacePlots(this.internalCommands, context.workspaceState)
    )

    this.repositories = this.dispose.track(
      new WorkspaceRepositories(this.internalCommands)
    )

    this.dispose.track(new Context(this.experiments, this.dvcRunner))

    this.dispose.track(
      new ExperimentsColumnsTree(
        this.experiments,
        this.internalCommands,
        this.resourceLocator
      )
    )

    this.dispose.track(
      new ExperimentsSortByTree(this.experiments, this.internalCommands)
    )

    this.dispose.track(
      new ExperimentsFilterByTree(this.experiments, this.internalCommands)
    )

    this.dispose.track(
      new ExperimentsTree(this.experiments, this.resourceLocator)
    )

    this.dispose.track(
      new PlotsPathsTree(
        this.plots,
        this.internalCommands,
        this.resourceLocator
      )
    )

    this.repositoriesTree = this.dispose.track(
      new RepositoriesTree(this.internalCommands, this.repositories)
    )

    this.setup = this.dispose.track(
      new Setup(
        context,
        config,
        this.internalCommands,
        this.experiments,
        status,
        this.resourceLocator.dvcIcon,
        stopWatch,
        () => this.initialize(),
        () => this.resetMembers(),
        () =>
          collectWorkspaceScale(
            this.getRoots(),
            this.experiments,
            this.plots,
            this.repositories
          )
      )
    )

    registerPatchCommand(this.internalCommands)
    registerExperimentCommands(
      this.experiments,
      this.internalCommands,
      this.setup
    )
    registerPlotsCommands(this.plots, this.internalCommands, this.setup)
    registerSetupCommands(this.setup, this.internalCommands)
    this.internalCommands.registerExternalCommand(
      RegisteredCommands.EXPERIMENT_AND_PLOTS_SHOW,
      async (context: VsCodeContext) => {
        if (this.setup.shouldBeShown()) {
          await commands.executeCommand(RegisteredCommands.SETUP_SHOW)
          return
        }
        const dvcRoot = getDvcRootFromContext(context)
        await this.experiments.showWebview(dvcRoot, ViewColumn.Active)
        await this.plots.showWebview(dvcRoot, ViewColumn.Beside)
      }
    )

    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.STOP_EXPERIMENTS,
        async () => {
          const stopWatch = new StopWatch()
          const pids = await collectRunningExperimentPids(this.getRoots())
          const wasRunning =
            this.dvcRunner.isExperimentRunning() ||
            definedAndNonEmpty(pids) ||
            this.experiments.hasRunningExperiment()
          try {
            const processesStopped = await Promise.all([
              stopProcesses(pids),
              ...this.getRoots().map(dvcRoot =>
                this.dvcExecutor.queueStop(dvcRoot, Flag.KILL)
              )
            ])
            const runnerStopped = await this.dvcRunner.stop()

            const stopped = processesStopped.every(Boolean) || runnerStopped
            sendTelemetryEvent(
              RegisteredCommands.STOP_EXPERIMENTS,
              { stopped, wasRunning },
              {
                duration: stopWatch.getElapsedTime()
              }
            )
            return stopped
          } catch (error: unknown) {
            return sendTelemetryEventAndThrow(
              RegisteredCommands.STOP_EXPERIMENTS,
              error as Error,
              stopWatch.getElapsedTime()
            )
          }
        }
      )
    )

    this.internalCommands.registerExternalCommand(
      RegisteredCommands.EXTENSION_SHOW_OUTPUT,
      () => outputChannel.show()
    )

    registerRepositoryCommands(this.repositories, this.internalCommands)

    reRegisterVsCodeCommands(this.internalCommands)
    registerWalkthroughCommands(
      this.internalCommands,
      (context.extension.packageJSON as { id: string }).id,
      (
        context.extension.packageJSON as {
          contributes: {
            walkthroughs: { id: string }[]
          }
        }
      ).contributes.walkthroughs[0].id
    )

    registerPersistenceCommands(context.workspaceState, this.internalCommands)

    void showWalkthroughOnFirstUse(env.isNewAppInstall)
    this.dispose.track(recommendRedHatExtensionOnce())

    this.dispose.track(new LanguageClient())
  }

  public async initialize() {
    this.resetMembers()

    await Promise.all([
      this.repositories.create(this.getRoots(), this.updatesPaused),
      this.repositoriesTree.initialize(this.getRoots()),
      this.experiments.create(
        this.getRoots(),
        this.updatesPaused,
        this.resourceLocator
      )
    ])
    this.plots.create(
      this.getRoots(),
      this.updatesPaused,
      this.resourceLocator,
      this.experiments
    )

    return Promise.all([
      this.repositories.isReady(),
      this.experiments.isReady(),
      this.plots.isReady()
    ])
  }

  public resetMembers() {
    this.repositories.reset()
    this.repositoriesTree.initialize([])
    this.experiments.reset()
    this.plots.reset()
  }

  private getRoots() {
    return this.setup.getRoots()
  }
}

let extension: undefined | Extension

export function activate(context: ExtensionContext): void {
  extension = new Extension(context)
  context.subscriptions.push(extension)
}

export function deactivate(): void {
  if (extension) {
    extension.dispose()
  }
}

export { Disposer, Disposable } from '@hediet/std/disposable'
