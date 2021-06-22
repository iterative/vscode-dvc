import {
  commands,
  Event,
  EventEmitter,
  ExtensionContext,
  window,
  workspace,
  WorkspaceFolder
} from 'vscode'
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
import { TrackedExplorerTree } from './fileSystem/views/trackedExplorerTree'
import {
  getRepositoryWatcher,
  onDidChangeFileSystem
} from './fileSystem/watcher'
import { IExtension } from './interfaces'
import { Repository } from './repository'
import { registerRepositoryCommands } from './repository/commands/register'
import { DecorationProvider } from './repository/decorationProvider'
import { ResourceLocator } from './resourceLocator'
import { reset } from './util/disposable'
import { setup } from './setup'
import { Status } from './status'
import { definedAndNonEmpty } from './util/array'
import { setContextValue } from './vscode/context'
import { OutputChannel } from './vscode/outputChannel'
import { WebviewSerializer } from './webviewSerializer'
import { reRegisterVsCodeCommands } from './vscode/commands'
import { InternalCommands } from './internalCommands'

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

    this.setCommandsAvailability(false)
    this.setProjectAvailability(false)

    this.resourceLocator = this.dispose.track(
      new ResourceLocator(context.extensionUri)
    )

    this.config = this.dispose.track(new Config())

    this.cliExecutor = this.dispose.track(new CliExecutor(this.config))
    this.cliReader = this.dispose.track(new CliReader(this.config))
    this.cliRunner = this.dispose.track(new CliRunner(this.config))

    this.internalCommands = new InternalCommands(
      this.cliExecutor,
      this.cliReader
    )

    this.status = this.dispose.track(
      new Status([this.cliExecutor, this.cliReader, this.cliRunner])
    )

    this.experiments = this.dispose.track(
      new Experiments(this.config, this.internalCommands)
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
        this.internalCommands,
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
      this.config.onDidChangeExecutionDetails(() => {
        setup(this)
      })
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

    registerRepositoryCommands(this.internalCommands)

    this.registerConfigCommands()

    reRegisterVsCodeCommands(this.dispose)
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
      (workspace.workspaceFolders || []).map(workspaceFolder =>
        this.setupWorkspaceFolder(workspaceFolder)
      )
    )

    this.dvcRoots = ([] as string[]).concat(...dvcRoots)
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

  public hasWorkspaceFolder = () => !!this.config.getFirstWorkspaceFolderRoot()

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

  private initializeRepositories = () => {
    reset(this.repositories, this.dispose)

    this.dvcRoots.forEach(dvcRoot => {
      const repository = new Repository(
        dvcRoot,
        this.internalCommands,
        this.decorationProviders[dvcRoot]
      )

      repository.dispose.track(
        onDidChangeFileSystem(
          dvcRoot,
          getRepositoryWatcher(repository, this.trackedExplorerTree)
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

  private setupWorkspaceFolder = async (workspaceFolder: WorkspaceFolder) => {
    const workspaceFolderRoot = workspaceFolder.uri.fsPath
    const dvcRoots = await this.findDvcRoots(workspaceFolderRoot)

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
