import { join } from 'path'
import { commands, Event, EventEmitter, ExtensionContext, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import { Config } from './config'
import { CliExecutor } from './cli/executor'
import { CliRunner } from './cli/runner'
import { CliReader } from './cli/reader'
import { getGitRepositoryRoots } from './extensions/git'
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
import { DecorationProvider } from './repository/decorationProvider'
import { ResourceLocator } from './resourceLocator'
import { reset } from './util/disposable'
import { setup, setupWorkspace } from './setup'
import { Status } from './status'
import { definedAndNonEmpty, flatten } from './util/array'
import { setContextValue } from './vscode/context'
import { OutputChannel } from './vscode/outputChannel'
import { WebviewSerializer } from './vscode/webviewSerializer'
import { reRegisterVsCodeCommands } from './vscode/commands'
import { InternalCommands } from './commands/internal'
import { ExperimentsParamsAndMetricsTree } from './experiments/paramsAndMetrics/tree'
import { ExperimentsSortByTree } from './experiments/model/sortBy/tree'
import { ExperimentsTree } from './experiments/model/tree'
import { ExperimentsFilterByTree } from './experiments/model/filterBy/tree'
import {
  getFirstWorkspaceFolder,
  getWorkspaceFolders
} from './vscode/workspaceFolders'
import { getTelemetryReporter, sendTelemetryEvent } from './telemetry'
import { RegisteredCommands } from './commands/external'
import { StopWatch } from './util/time'

export { Disposable, Disposer }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

type Repositories = Record<string, Repository>
type DecorationProviders = Record<string, DecorationProvider>

export class Extension implements IExtension {
  public readonly dispose = Disposable.fn()

  protected readonly internalCommands: InternalCommands

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
  private readonly webviewSerializer: WebviewSerializer
  private dvcRoots: string[] = []
  private decorationProviders: DecorationProviders = {}
  private repositories: Repositories = {}
  private readonly experiments: Experiments
  private readonly trackedExplorerTree: TrackedExplorerTree
  private readonly cliExecutor: CliExecutor
  private readonly cliReader: CliReader
  private readonly cliRunner: CliRunner
  private readonly status: Status

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private readonly onDidChangeWorkspace: Event<void> =
    this.workspaceChanged.event

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

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

    this.internalCommands = this.dispose.track(
      new InternalCommands(
        this.config,
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
        this.resourceLocator
      )
    )

    this.dispose.track(new ExperimentsSortByTree(this.experiments))

    this.dispose.track(new ExperimentsFilterByTree(this.experiments))

    this.dispose.track(new ExperimentsTree(this.experiments))

    this.dispose.track(
      this.cliRunner.onDidCompleteProcess(({ cwd }) => {
        this.experiments.refreshData(cwd)
      })
    )

    this.dispose.track(
      new OutputChannel(
        [this.cliExecutor, this.cliReader, this.cliRunner],
        context.extension.packageJSON.version
      )
    )

    this.trackedExplorerTree = this.dispose.track(
      new TrackedExplorerTree(this.internalCommands, this.workspaceChanged)
    )

    setup(this)

    this.dispose.track(
      this.onDidChangeWorkspace(() => {
        setup(this)
      })
    )

    this.dispose.track(
      this.config.onDidChangeExecutionDetails(() => {
        setup(this)
      })
    )

    this.webviewSerializer = this.dispose.track(
      new WebviewSerializer(this.internalCommands, this.experiments)
    )

    this.dispose.track(this.webviewSerializer)

    registerExperimentCommands(this.experiments)
    this.dispose.track(
      commands.registerCommand(RegisteredCommands.STOP_EXPERIMENT, async () => {
        const stopWatch = new StopWatch()
        const wasRunning = this.cliRunner.isRunning()
        const stopped = await this.cliRunner.stop()
        sendTelemetryEvent(
          RegisteredCommands.STOP_EXPERIMENT,
          { stopped, wasRunning },
          {
            duration: stopWatch.getElapsedTime()
          }
        )
        return stopped
      })
    )

    registerRepositoryCommands(this.internalCommands)

    this.registerConfigCommands()

    reRegisterVsCodeCommands(this.dispose)

    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        async () => {
          const stopWatch = new StopWatch()
          const completed = await setupWorkspace()
          sendTelemetryEvent(
            RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
            { completed },
            {
              duration: stopWatch.getElapsedTime()
            }
          )
          return completed
        }
      )
    )
  }

  public hasRoots = () => definedAndNonEmpty(this.dvcRoots)

  public canRunCli = async () => {
    try {
      await this.config.isReady()
      const [root] = this.dvcRoots
      return !!(await this.cliReader.help(root))
    } catch (e) {
      return false
    }
  }

  public initializePreCheck = async () => {
    const dvcRoots = await Promise.all(
      getWorkspaceFolders().map(workspaceFolder =>
        this.setupWorkspaceFolder(workspaceFolder)
      )
    )

    this.dvcRoots = flatten(dvcRoots)
    this.config.setDvcRoots(this.dvcRoots)
  }

  public initialize = () => {
    Promise.all([
      this.initializeRepositories(),
      this.trackedExplorerTree.initialize(this.dvcRoots),
      this.initializeExperiments(),
      this.setAvailable(true)
    ])
  }

  public hasWorkspaceFolder = () => !!getFirstWorkspaceFolder()

  public reset = () => {
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
    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.EXTENSION_DESELECT_DEFAULT_PROJECT,
        async () => {
          const stopWatch = new StopWatch()
          await this.config.deselectDefaultProject()
          return sendTelemetryEvent(
            RegisteredCommands.EXTENSION_DESELECT_DEFAULT_PROJECT,
            undefined,
            {
              duration: stopWatch.getElapsedTime()
            }
          )
        }
      )
    )

    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.EXTENSION_SELECT_DEFAULT_PROJECT,
        async () => {
          const stopWatch = new StopWatch()
          await this.config.selectDefaultProject()
          return sendTelemetryEvent(
            RegisteredCommands.EXTENSION_SELECT_DEFAULT_PROJECT,
            undefined,
            {
              duration: stopWatch.getElapsedTime()
            }
          )
        }
      )
    )
  }

  private initializeRepositories = () => {
    this.repositories = reset<Repositories>(this.repositories, this.dispose)

    this.dvcRoots.forEach(dvcRoot => {
      const repository = new Repository(
        dvcRoot,
        this.internalCommands,
        this.decorationProviders[dvcRoot]
      )

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

  private initializeDecorationProvidersEarly = (dvcRoots: string[]) =>
    dvcRoots
      .filter(dvcRoot => !this.dvcRoots.includes(dvcRoot))
      .forEach(
        dvcRoot =>
          (this.decorationProviders[dvcRoot] = this.dispose.track(
            new DecorationProvider()
          ))
      )

  private findDvcRoots = async (cwd: string): Promise<string[]> => {
    const dvcRoots = await findDvcRootPaths(cwd)
    if (definedAndNonEmpty(dvcRoots)) {
      return dvcRoots
    }

    await this.config.isReady()
    return findAbsoluteDvcRootPath(cwd, this.cliReader.root(cwd))
  }

  private setupWorkspaceFolder = async (workspaceFolder: string) => {
    const dvcRoots = await this.findDvcRoots(workspaceFolder)

    if (definedAndNonEmpty(dvcRoots)) {
      this.initializeDecorationProvidersEarly(dvcRoots)
      this.setProjectAvailability(true)
    }

    return dvcRoots
  }
}

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    hotRequireExportedFn(
      module,
      Extension,
      HotExtension => new HotExtension(context)
    )
  )
}

// export function deactivate(): void {}
