import { commands, env, Event, EventEmitter, ExtensionContext } from 'vscode'
import { DvcExecutor } from './cli/dvc/executor'
import { DvcRunner } from './cli/dvc/runner'
import { DvcReader } from './cli/dvc/reader'
import { Config } from './config'
import { Context } from './context'
import { isVersionCompatible } from './cli/dvc/version'
import { isPythonExtensionInstalled } from './extensions/python'
import { WorkspaceExperiments } from './experiments/workspace'
import { registerExperimentCommands } from './experiments/commands/register'
import { registerPlotsCommands } from './plots/commands/register'
import { findAbsoluteDvcRootPath, findDvcRootPaths } from './fileSystem'
import { TrackedExplorerTree } from './fileSystem/tree'
import { IExtension } from './interfaces'
import { registerRepositoryCommands } from './repository/commands/register'
import { ResourceLocator } from './resourceLocator'
import { definedAndNonEmpty } from './util/array'
import { setup, setupWorkspace } from './setup'
import { Status } from './status'
import { reRegisterVsCodeCommands } from './vscode/commands'
import { InternalCommands } from './commands/internal'
import { ExperimentsColumnsTree } from './experiments/columns/tree'
import { ExperimentsSortByTree } from './experiments/model/sortBy/tree'
import { ExperimentsTree } from './experiments/model/tree'
import { ExperimentsFilterByTree } from './experiments/model/filterBy/tree'
import { setContextValue } from './vscode/context'
import { OutputChannel } from './vscode/outputChannel'
import {
  getFirstWorkspaceFolder,
  getWorkspaceFolderCount,
  getWorkspaceFolders
} from './vscode/workspaceFolders'
import {
  getTelemetryReporter,
  sendTelemetryEvent,
  sendTelemetryEventAndThrow
} from './telemetry'
import { EventName } from './telemetry/constants'
import { RegisteredCliCommands, RegisteredCommands } from './commands/external'
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
import { createFileSystemWatcher } from './fileSystem/watcher'
import { GitExecutor } from './cli/git/executor'
import { GitReader } from './cli/git/reader'

export class Extension extends Disposable implements IExtension {
  protected readonly internalCommands: InternalCommands

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
  private dvcRoots: string[] = []
  private readonly repositories: WorkspaceRepositories
  private readonly experiments: WorkspaceExperiments
  private readonly plots: WorkspacePlots
  private readonly trackedExplorerTree: TrackedExplorerTree
  private readonly dvcExecutor: DvcExecutor
  private readonly dvcReader: DvcReader
  private readonly dvcRunner: DvcRunner
  private readonly gitExecutor: GitExecutor
  private readonly gitReader: GitReader
  private readonly status: Status
  private cliAccessible = false
  private cliCompatible: boolean | undefined

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private updatesPaused: EventEmitter<boolean> = this.dispose.track(
    new EventEmitter<boolean>()
  )

  private readonly onDidChangeWorkspace: Event<void> =
    this.workspaceChanged.event

  constructor(context: ExtensionContext) {
    super()

    const stopWatch = new StopWatch()

    this.dispose.track(getTelemetryReporter())

    this.setCommandsAvailability(false)
    this.setProjectAvailability()

    this.resourceLocator = this.dispose.track(
      new ResourceLocator(context.extensionUri)
    )

    this.config = this.dispose.track(new Config())

    this.dvcExecutor = this.dispose.track(new DvcExecutor(this.config))
    this.dvcReader = this.dispose.track(new DvcReader(this.config))
    this.dvcRunner = this.dispose.track(new DvcRunner(this.config))

    this.gitExecutor = this.dispose.track(new GitExecutor())
    this.gitReader = this.dispose.track(new GitReader())

    const clis = [
      this.dvcExecutor,
      this.dvcReader,
      this.dvcRunner,
      this.gitExecutor,
      this.gitReader
    ]

    const outputChannel = this.dispose.track(
      new OutputChannel(clis, context.extension.packageJSON.version)
    )

    this.internalCommands = this.dispose.track(
      new InternalCommands(outputChannel, ...clis)
    )

    this.status = this.dispose.track(
      new Status([this.dvcExecutor, this.dvcReader, this.dvcRunner])
    )

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

    this.trackedExplorerTree = this.dispose.track(
      new TrackedExplorerTree(this.internalCommands, this.repositories)
    )

    setup(this)
      .then(async () =>
        sendTelemetryEvent(
          EventName.EXTENSION_LOAD,
          await this.getEventProperties(),
          { duration: stopWatch.getElapsedTime() }
        )
      )
      .catch(async error =>
        sendTelemetryEventAndThrow(
          EventName.EXTENSION_LOAD,
          error,
          stopWatch.getElapsedTime(),
          await this.getEventProperties()
        )
      )

    this.dispose.track(
      this.onDidChangeWorkspace(() => {
        setup(this)
      })
    )

    this.dispose.track(
      this.config.onDidChangeExecutionDetails(async () => {
        const stopWatch = new StopWatch()
        try {
          await setup(this)

          return sendTelemetryEvent(
            EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
            await this.getEventProperties(),
            { duration: stopWatch.getElapsedTime() }
          )
        } catch (error: unknown) {
          return sendTelemetryEventAndThrow(
            EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
            error as Error,
            stopWatch.getElapsedTime(),
            await this.getEventProperties()
          )
        }
      })
    )

    registerExperimentCommands(this.experiments, this.internalCommands)
    registerPlotsCommands(this.plots, this.internalCommands)

    this.dispose.track(
      commands.registerCommand(RegisteredCommands.STOP_EXPERIMENT, async () => {
        const stopWatch = new StopWatch()
        const wasRunning = this.dvcRunner.isExperimentRunning()
        try {
          const stopped = await this.dvcRunner.stop()
          sendTelemetryEvent(
            RegisteredCommands.STOP_EXPERIMENT,
            { stopped, wasRunning },
            {
              duration: stopWatch.getElapsedTime()
            }
          )
          return stopped
        } catch (error: unknown) {
          return sendTelemetryEventAndThrow(
            RegisteredCommands.STOP_EXPERIMENT,
            error as Error,
            stopWatch.getElapsedTime()
          )
        }
      })
    )

    this.internalCommands.registerExternalCommand(
      RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE,
      () => setup(this)
    )

    this.internalCommands.registerExternalCommand(
      RegisteredCommands.EXTENSION_SHOW_OUTPUT,
      () => outputChannel.show()
    )

    this.internalCommands.registerExternalCliCommand(
      RegisteredCliCommands.INIT,
      async () => {
        const root = getFirstWorkspaceFolder()
        if (root) {
          await this.dvcExecutor.init(root)
          this.workspaceChanged.fire()
        }
      }
    )

    registerRepositoryCommands(this.repositories, this.internalCommands)

    reRegisterVsCodeCommands(this.internalCommands)
    registerWalkthroughCommands(
      this.internalCommands,
      context.extension.packageJSON.id,
      context.extension.packageJSON.contributes.walkthroughs[0].id
    )

    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        () => this.setupWorkspace()
      )
    )

    showWalkthroughOnFirstUse(env.isNewAppInstall)
    this.dispose.track(recommendRedHatExtensionOnce())

    this.watchForVenvChanges()
  }

  public async setupWorkspace() {
    const stopWatch = new StopWatch()
    try {
      const previousCliPath = this.config.getCliPath()
      const previousPythonPath = this.config.pythonBinPath

      const completed = await setupWorkspace()
      sendTelemetryEvent(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        { completed },
        {
          duration: stopWatch.getElapsedTime()
        }
      )

      const executionDetailsUnchanged =
        this.config.getCliPath() === previousPythonPath &&
        this.config.pythonBinPath === previousCliPath

      if (completed && !this.cliAccessible && executionDetailsUnchanged) {
        this.workspaceChanged.fire()
      }

      return completed
    } catch (error: unknown) {
      return sendTelemetryEventAndThrow(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        error as Error,
        stopWatch.getElapsedTime()
      )
    }
  }

  public async canRunCli(cwd: string) {
    await this.config.isReady()
    setContextValue('dvc.cli.incompatible', undefined)
    const version = await this.dvcReader.version(cwd)
    const compatible = isVersionCompatible(version)
    this.cliCompatible = compatible
    setContextValue('dvc.cli.incompatible', !compatible)
    return this.setAvailable(compatible)
  }

  public async setRoots() {
    const nestedRoots = await Promise.all(
      getWorkspaceFolders().map(workspaceFolder =>
        this.findDvcRoots(workspaceFolder)
      )
    )
    this.dvcRoots = nestedRoots.flat().sort()

    return this.setProjectAvailability()
  }

  public async initialize() {
    this.resetMembers()

    await Promise.all([
      this.repositories.create(this.dvcRoots, this.updatesPaused),
      this.trackedExplorerTree.initialize(this.dvcRoots),
      this.experiments.create(
        this.dvcRoots,
        this.updatesPaused,
        this.resourceLocator
      ),
      this.plots.create(this.dvcRoots, this.updatesPaused, this.resourceLocator)
    ])

    this.experiments.linkRepositories(this.plots)

    return Promise.all([
      this.repositories.isReady(),
      this.experiments.isReady(),
      this.plots.isReady()
    ])
  }

  public hasRoots() {
    return definedAndNonEmpty(this.dvcRoots)
  }

  public resetMembers() {
    this.repositories.reset()
    this.trackedExplorerTree.initialize([])
    this.experiments.reset()
    this.plots.reset()
  }

  public setAvailable(available: boolean) {
    this.status.setAvailability(available)
    this.setCommandsAvailability(available)
    this.cliAccessible = available
    return available
  }

  private setCommandsAvailability(available: boolean) {
    setContextValue('dvc.commands.available', available)
  }

  private setProjectAvailability() {
    const available = this.hasRoots()
    setContextValue('dvc.project.available', available)
  }

  private findDvcRoots = async (cwd: string): Promise<string[]> => {
    const dvcRoots = await findDvcRootPaths(cwd)
    if (definedAndNonEmpty(dvcRoots)) {
      return dvcRoots
    }

    await this.config.isReady()
    return findAbsoluteDvcRootPath(cwd, this.dvcReader.root(cwd))
  }

  private async getEventProperties() {
    return {
      ...(this.cliAccessible
        ? await collectWorkspaceScale(
            this.dvcRoots,
            this.experiments,
            this.plots,
            this.repositories
          )
        : {}),
      cliAccessible: this.cliAccessible,
      dvcPathUsed: !!this.config.getCliPath(),
      dvcRootCount: this.dvcRoots.length,
      msPythonInstalled: isPythonExtensionInstalled(),
      msPythonUsed: this.config.isPythonExtensionUsed(),
      pythonPathUsed: !!this.config.pythonBinPath,
      workspaceFolderCount: getWorkspaceFolderCount()
    }
  }

  private watchForVenvChanges() {
    this.dispose.track(
      createFileSystemWatcher('**/dvc{,.exe}', path => {
        if (path && (!this.cliAccessible || !this.cliCompatible)) {
          setup(this)
        }
      })
    )
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
