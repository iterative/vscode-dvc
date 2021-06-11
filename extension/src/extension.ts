import { commands, Event, EventEmitter, ExtensionContext, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import { Config } from './config'
import { WebviewSerializer } from './webviewSerializer'
import { Experiments } from './experiments'
import { registerExperimentCommands } from './experiments/commands/register'
import { registerRepositoryCommands } from './repository/commands/register'
import { findDvcRootPaths } from './fileSystem'
import {
  getRepositoryWatcher,
  onDidChangeFileSystem
} from './fileSystem/watcher'
import { ResourceLocator } from './resourceLocator'
import { Status } from './status'
import { DecorationProvider } from './repository/decorationProvider'
import { getGitRepositoryRoots } from './extensions/git'
import { Repository } from './repository'
import { TrackedExplorerTree } from './fileSystem/views/trackedExplorerTree'
import { CliExecutor } from './cli/executor'
import { setContextValue } from './vscode/context'
import { CliRunner } from './cli/runner'
import { CliReader } from './cli/reader'
import { OutputChannel } from './vscode/outputChannel'
import { IExtension, setup } from './setup'

export { Disposable, Disposer }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

export class Extension implements IExtension {
  public readonly dispose = Disposable.fn()

  private readonly resourceLocator: ResourceLocator
  readonly config: Config
  private readonly webviewSerializer: WebviewSerializer
  private dvcRoots: string[] = []
  private decorationProviders: Record<string, DecorationProvider> = {}
  private dvcRepositories: Record<string, Repository> = {}
  private readonly experiments: Experiments
  private readonly trackedExplorerTree: TrackedExplorerTree
  private readonly cliExecutor: CliExecutor
  private readonly cliReader: CliReader
  private readonly cliRunner: CliRunner
  private readonly status: Status

  public getCliReader = () => this.cliReader

  public getDvcRoots = () => this.dvcRoots
  public setDvcRoots = (dvcRoots: string[]) => (this.dvcRoots = dvcRoots)

  public getDecorationProvider = (dvcRoot: string) =>
    this.decorationProviders[dvcRoot]

  public setDecorationProvider = (
    dvcRoot: string,
    decorationProvider: DecorationProvider
  ) =>
    (this.decorationProviders[dvcRoot] = this.dispose.track(decorationProvider))

  public getRepository = (dvcRoot: string): Repository =>
    this.dvcRepositories[dvcRoot]

  public setRepository = (dvcRoot: string, repository: Repository) =>
    (this.dvcRepositories[dvcRoot] = this.dispose.track(repository))

  public resetRepositories = () => {
    this.dvcRoots.forEach(dvcRoot => {
      const repository = this.dvcRepositories[dvcRoot]
      this.dispose.untrack(repository)
      repository.dispose()
    })
    this.dvcRepositories = {}
  }

  public getExperiments = () => this.experiments
  public getTrackedExplorerTree = () => this.trackedExplorerTree

  public getResourceLocator = () => this.resourceLocator

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private readonly onDidChangeWorkspace: Event<void> = this.workspaceChanged
    .event

  public canRunCli = async () => {
    try {
      const root = this.config.firstWorkspaceFolderRoot
      return !!(root && (await this.cliExecutor.help(root)))
    } catch (e) {
      return false
    }
  }

  public setUnavailable = () => {
    this.resetRepositories()

    this.status.setAvailability(false)
    return this.setCommandsAvailability(false)
  }

  public setAvailable = () => {
    this.status.setAvailability(true)
    return this.setCommandsAvailability(true)
  }

  private async initializeOrNotify() {
    const root = this.config.firstWorkspaceFolderRoot
    if (!root) {
      this.setUnavailable()
    } else if (await this.canRunCli()) {
      this.initialize()
    } else {
      window.showInformationMessage(
        'DVC extension is unable to initialize as the cli is not available.\n' +
          'Update your config options to try again.'
      )
      this.setUnavailable()
    }
  }

  private initialize() {
    this.initializeDvcRepositories()

    this.trackedExplorerTree.initialize(this.dvcRoots)

    this.initializeExperiments()

    this.initializeGitRepositories()

    this.status.setAvailability(true)
    return this.setCommandsAvailability(true)
  }

  private initializeDvcRepositories() {
    this.dvcRoots.forEach(dvcRoot => {
      if (!this.dvcRepositories[dvcRoot]) {
        const repository = this.dispose.track(
          new Repository(
            dvcRoot,
            this.cliReader,
            this.decorationProviders[dvcRoot]
          )
        )

        repository.dispose.track(
          onDidChangeFileSystem(
            dvcRoot,
            getRepositoryWatcher(repository, this.trackedExplorerTree)
          )
        )

        this.dvcRepositories[dvcRoot] = repository
      }
    })
  }

  private initializeExperiments() {
    this.experiments.reset()
    this.experiments.create(this.dvcRoots, this.resourceLocator)
  }

  private async initializeGitRepositories() {
    const [, gitRoots] = await Promise.all([
      this.experiments.isReady(),
      getGitRepositoryRoots()
    ])
    gitRoots.forEach(async gitRoot => {
      const dvcRoots = await findDvcRootPaths(
        gitRoot,
        this.cliReader.root(gitRoot)
      )

      dvcRoots.forEach(dvcRoot => {
        this.experiments.onDidChangeData(dvcRoot, gitRoot)
      })
    })
  }

  private setCommandsAvailability(available: boolean) {
    setContextValue('dvc.commands.available', available)
  }

  private setProjectAvailability(available: boolean) {
    setContextValue('dvc.project.available', available)
  }

  private registerConfigCommands() {
    this.dispose.track(
      commands.registerCommand('dvc.deselectDefaultProject', () =>
        this.config.deselectDefaultProject()
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.selectDvcPath', () =>
        this.config.selectDvcPath()
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.selectDefaultProject', () =>
        this.config.selectDefaultProject()
      )
    )
  }

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.setCommandsAvailability(false)
    this.setProjectAvailability(false)

    this.resourceLocator = this.dispose.track(
      new ResourceLocator(context.extensionUri)
    )

    this.config = this.dispose.track(new Config())

    this.cliExecutor = this.dispose.track(new CliExecutor(this.config))
    this.cliReader = this.dispose.track(new CliReader(this.config))
    this.cliRunner = this.dispose.track(new CliRunner(this.config))

    this.status = this.dispose.track(
      new Status([this.cliExecutor, this.cliReader, this.cliRunner])
    )

    this.experiments = this.dispose.track(
      new Experiments(this.config, this.cliReader)
    )

    this.dispose.track(
      new OutputChannel(
        [this.cliExecutor, this.cliReader, this.cliRunner],
        context.extension.packageJSON.version
      )
    )

    this.trackedExplorerTree = this.dispose.track(
      new TrackedExplorerTree(
        this.config,
        this.cliReader,
        this.cliExecutor,
        this.workspaceChanged
      )
    )

    setup(this)

    this.dispose.track(
      this.onDidChangeWorkspace(() => {
        setup(this)
      })
    )

    this.dispose.track(
      this.config.onDidChangeExecutionDetails(() => this.initializeOrNotify())
    )

    this.webviewSerializer = new WebviewSerializer(
      this.config,
      this.experiments
    )
    this.dispose.track(this.webviewSerializer)

    registerExperimentCommands(
      this.experiments,
      this.cliExecutor,
      this.cliRunner
    )

    registerRepositoryCommands(this.cliExecutor)

    this.registerConfigCommands()
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
