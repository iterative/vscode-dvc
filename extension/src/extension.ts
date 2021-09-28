import { join } from 'path'
import { commands, Event, EventEmitter, ExtensionContext } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { Config } from './config'
import { CliExecutor } from './cli/executor'
import { CliRunner } from './cli/runner'
import { CliReader } from './cli/reader'
import { getGitRepositoryRoots } from './extensions/git'
import { isPythonExtensionInstalled } from './extensions/python'
import { Experiments } from './experiments'
import { registerExperimentCommands } from './experiments/commands/register'
import { findAbsoluteDvcRootPath, findDvcRootPaths } from './fileSystem'
import { TrackedExplorerTree } from './fileSystem/tree'
import {
  createFileSystemWatcher,
  getRepositoryListener
} from './fileSystem/watcher'
import { IExtension } from './interfaces'
import { Repository } from './repository'
import { registerRepositoryCommands } from './repository/commands/register'
import { ResourceLocator } from './resourceLocator'
import { definedAndNonEmpty, flatten } from './util/array'
import { reset } from './util/disposable'
import { setup, setupWorkspace } from './setup'
import { Status } from './status'
import { reRegisterVsCodeCommands } from './vscode/commands'
import { InternalCommands } from './commands/internal'
import { ExperimentsParamsAndMetricsTree } from './experiments/paramsAndMetrics/tree'
import { ExperimentsSortByTree } from './experiments/model/sortBy/tree'
import { ExperimentsTree } from './experiments/model/tree'
import { ExperimentsFilterByTree } from './experiments/model/filterBy/tree'
import { setContextValue } from './vscode/context'
import { OutputChannel } from './vscode/outputChannel'
import { WebviewSerializer } from './vscode/webviewSerializer'
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
import { RegisteredCommands } from './commands/external'
import { StopWatch } from './util/time'

export { Disposable, Disposer }

type Repositories = Record<string, Repository>

export class Extension implements IExtension {
  public readonly dispose = Disposable.fn()

  protected readonly internalCommands: InternalCommands

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
  private readonly webviewSerializer: WebviewSerializer
  private dvcRoots: string[] = []
  private repositories: Repositories = {}
  private readonly experiments: Experiments
  private readonly trackedExplorerTree: TrackedExplorerTree
  private readonly cliExecutor: CliExecutor
  private readonly cliReader: CliReader
  private readonly cliRunner: CliRunner
  private readonly status: Status
  private cliAccessible = false

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private readonly onDidChangeWorkspace: Event<void> =
    this.workspaceChanged.event

  constructor(context: ExtensionContext) {
    const stopWatch = new StopWatch()

    this.dispose.track(getTelemetryReporter())

    this.setCommandsAvailability(false)
    this.setProjectAvailability(false)

    this.resourceLocator = this.dispose.track(
      new ResourceLocator(context.extensionUri)
    )

    this.config = this.dispose.track(new Config())

    this.cliExecutor = this.dispose.track(new CliExecutor(this.config))
    this.cliReader = this.dispose.track(new CliReader(this.config))
    this.cliRunner = this.dispose.track(new CliRunner(this.config))

    const outputChannel = this.dispose.track(
      new OutputChannel(
        [this.cliExecutor, this.cliReader, this.cliRunner],
        context.extension.packageJSON.version
      )
    )

    this.internalCommands = this.dispose.track(
      new InternalCommands(
        this.config,
        outputChannel,
        this.cliExecutor,
        this.cliReader,
        this.cliRunner
      )
    )

    this.status = this.dispose.track(
      new Status([this.cliExecutor, this.cliReader, this.cliRunner])
    )

    this.experiments = this.dispose.track(
      new Experiments(this.internalCommands, context.workspaceState)
    )

    this.dispose.track(
      new ExperimentsParamsAndMetricsTree(
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

    this.dispose.track(new ExperimentsTree(this.experiments))

    this.dispose.track(
      this.cliRunner.onDidCompleteProcess(({ cwd }) => {
        this.experiments.refreshData(cwd)
      })
    )

    this.trackedExplorerTree = this.dispose.track(
      new TrackedExplorerTree(this.internalCommands, this.workspaceChanged)
    )

    setup(this)
      .then(() =>
        sendTelemetryEvent(
          EventName.EXTENSION_LOAD,
          this.getEventProperties(),
          { duration: stopWatch.getElapsedTime() }
        )
      )
      .catch(e =>
        sendTelemetryEventAndThrow(
          EventName.EXTENSION_LOAD,
          e,
          stopWatch.getElapsedTime(),
          this.getEventProperties()
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
            this.getEventProperties(),
            { duration: stopWatch.getElapsedTime() }
          )
        } catch (e: unknown) {
          return sendTelemetryEventAndThrow(
            EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
            e as Error,
            stopWatch.getElapsedTime(),
            this.getEventProperties()
          )
        }
      })
    )

    this.webviewSerializer = this.dispose.track(
      new WebviewSerializer(this.internalCommands, this.experiments)
    )

    this.dispose.track(this.webviewSerializer)

    registerExperimentCommands(this.experiments, this.internalCommands)

    this.dispose.track(
      commands.registerCommand(RegisteredCommands.STOP_EXPERIMENT, async () => {
        const stopWatch = new StopWatch()
        const wasRunning = this.cliRunner.isRunning()
        try {
          const stopped = await this.cliRunner.stop()
          sendTelemetryEvent(
            RegisteredCommands.STOP_EXPERIMENT,
            { stopped, wasRunning },
            {
              duration: stopWatch.getElapsedTime()
            }
          )
          return stopped
        } catch (e: unknown) {
          return sendTelemetryEventAndThrow(
            RegisteredCommands.STOP_EXPERIMENT,
            e as Error,
            stopWatch.getElapsedTime()
          )
        }
      })
    )

    this.dispose.track(
      this.internalCommands.registerExternalCommand(
        RegisteredCommands.EXTENSION_SHOW_COMMANDS,
        () => commands.executeCommand('workbench.action.quickOpen', '> DVC')
      )
    )

    registerRepositoryCommands(this.internalCommands)

    this.registerConfigCommands()

    reRegisterVsCodeCommands(this.internalCommands)

    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        async () => {
          const stopWatch = new StopWatch()
          try {
            const completed = await setupWorkspace()
            sendTelemetryEvent(
              RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
              { completed },
              {
                duration: stopWatch.getElapsedTime()
              }
            )
            return completed
          } catch (e: unknown) {
            return sendTelemetryEventAndThrow(
              RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
              e as Error,
              stopWatch.getElapsedTime()
            )
          }
        }
      )
    )
  }

  public async canRunCli() {
    try {
      await this.config.isReady()
      const cwd = getFirstWorkspaceFolder()
      if (!cwd) {
        return false
      }
      this.cliAccessible = !!(await this.cliReader.help(cwd))
      return this.cliAccessible
    } catch {
      return false
    }
  }

  public async setRoots() {
    this.dvcRoots = flatten(
      await Promise.all(
        getWorkspaceFolders().map(workspaceFolder =>
          this.findDvcRoots(workspaceFolder)
        )
      )
    ).sort()
    if (this.hasRoots()) {
      return this.setProjectAvailability(true)
    }
    this.setProjectAvailability(false)
  }

  public async initialize() {
    await Promise.all([
      this.config.setDvcRoots(this.dvcRoots),
      this.initializeRepositories(),
      this.trackedExplorerTree.initialize(this.dvcRoots),
      this.initializeExperiments(),
      this.setAvailable(true)
    ])

    return Promise.all([
      ...Object.values(this.repositories).map(repo => repo.isReady()),
      this.experiments.isReady()
    ])
  }

  public hasRoots() {
    return definedAndNonEmpty(this.dvcRoots)
  }

  public hasWorkspaceFolder() {
    return !!getFirstWorkspaceFolder()
  }

  public reset() {
    this.config.setDvcRoots([])
    this.repositories = reset<Repositories>(this.repositories, this.dispose)
    this.trackedExplorerTree.initialize([])
    this.experiments.reset()
    return this.setAvailable(false)
  }

  private setAvailable = (available: boolean) => {
    this.status.setAvailability(available)
    return this.setCommandsAvailability(available)
  }

  private setCommandsAvailability(available: boolean) {
    setContextValue('dvc.commands.available', available)
  }

  private setProjectAvailability(available: boolean) {
    setContextValue('dvc.project.available', available)
  }

  private registerConfigCommands() {
    this.internalCommands.registerExternalCommand(
      RegisteredCommands.EXTENSION_DESELECT_DEFAULT_PROJECT,
      () => this.config.deselectDefaultProject()
    )

    this.internalCommands.registerExternalCommand(
      RegisteredCommands.EXTENSION_SELECT_DEFAULT_PROJECT,
      () => this.config.selectDefaultProject()
    )
  }

  private initializeRepositories = () => {
    this.repositories = reset<Repositories>(this.repositories, this.dispose)

    this.dvcRoots.forEach(dvcRoot => {
      const repository = new Repository(dvcRoot, this.internalCommands)

      repository.dispose.track(
        createFileSystemWatcher(
          join(dvcRoot, '**'),
          getRepositoryListener(repository, this.trackedExplorerTree)
        )
      )

      this.repositories[dvcRoot] = repository
    })
  }

  private initializeExperiments = async () => {
    this.experiments.reset()

    this.experiments.create(this.dvcRoots, this.resourceLocator)
    const [, gitRoots] = await Promise.all([
      this.experiments.isReady(),
      getGitRepositoryRoots()
    ])
    gitRoots.forEach(async gitRoot => {
      const dvcRoots = await findDvcRootPaths(gitRoot)

      dvcRoots.forEach(dvcRoot => {
        this.experiments.onDidChangeData(dvcRoot, gitRoot)
      })
    })
  }

  private findDvcRoots = async (cwd: string): Promise<string[]> => {
    const dvcRoots = await findDvcRootPaths(cwd)
    if (definedAndNonEmpty(dvcRoots)) {
      return dvcRoots
    }

    await this.config.isReady()
    return findAbsoluteDvcRootPath(cwd, this.cliReader.root(cwd))
  }

  private getEventProperties() {
    return {
      cliAccessible: this.cliAccessible,
      dvcPathUsed: !!this.config.getCliPath(),
      dvcRootCount: this.dvcRoots.length,
      msPythonInstalled: isPythonExtensionInstalled(),
      msPythonUsed: this.config.isPythonExtensionUsed(),
      pythonPathUsed: !!this.config.pythonBinPath,
      workspaceFolderCount: getWorkspaceFolderCount()
    }
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
