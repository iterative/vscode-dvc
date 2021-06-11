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
import { WebviewSerializer } from './webviewSerializer'
import { Experiments } from './experiments'
import { registerExperimentCommands } from './experiments/commands/register'
import { registerRepositoryCommands } from './repository/commands/register'
import { findAbsoluteDvcRootPath, findDvcRootPaths } from './fileSystem'
import { ResourceLocator } from './resourceLocator'
import { Status } from './status'
import { DecorationProvider } from './repository/decorationProvider'
import { Repository } from './repository'
import { TrackedExplorerTree } from './fileSystem/views/trackedExplorerTree'
import { CliExecutor } from './cli/executor'
import { setContextValue } from './vscode/context'
import { CliRunner } from './cli/runner'
import { CliReader } from './cli/reader'
import { OutputChannel } from './vscode/outputChannel'
import { IExtension, initializeOrNotify } from './setup'
import { definedAndNonEmpty } from './util/array'
import { reset } from './util/disposable'

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
    this.dvcRepositories = reset(this.dvcRepositories, this.dispose)
    this.experiments.reset()
    this.trackedExplorerTree.initialize([])
    this.status.setAvailability(false)
    return this.setCommandsAvailability(false)
  }

  public setAvailable = () => {
    this.status.setAvailability(true)
    return this.setCommandsAvailability(true)
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

  private initializeDecorationProvidersEarly = () =>
    this.dvcRoots.forEach(dvcRoot =>
      this.setDecorationProvider(dvcRoot, new DecorationProvider())
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

    this.setDvcRoots(dvcRoots)
    this.config.setDvcRoots(dvcRoots)

    if (definedAndNonEmpty(dvcRoots)) {
      this.initializeDecorationProvidersEarly()
      this.setProjectAvailability(true)
    }
  }

  private setup = async () => {
    await Promise.all([
      (workspace.workspaceFolders || []).map(workspaceFolder =>
        this.setupWorkspaceFolder(workspaceFolder)
      ),
      this.config.isReady()
    ])

    return initializeOrNotify(this)
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

    this.setup()

    this.dispose.track(
      this.onDidChangeWorkspace(() => {
        this.setup()
      })
    )

    this.dispose.track(
      this.config.onDidChangeExecutionDetails(() => initializeOrNotify(this))
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
