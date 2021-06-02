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
import { definedAndNonEmpty } from './util'
import { CliRunner } from './cli/runner'
import { CliReader } from './cli/reader'
import { OutputChannel } from './vscode/outputChannel'

export { Disposable, Disposer }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

export class Extension {
  public readonly dispose = Disposable.fn()

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
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

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private readonly onDidChangeWorkspace: Event<void> = this.workspaceChanged
    .event

  private async setup() {
    await Promise.all([
      (workspace.workspaceFolders || []).map(workspaceFolder =>
        this.setupWorkspaceFolder(workspaceFolder)
      ),
      this.config.isReady()
    ])
    this.config.setDvcRoots(this.dvcRoots)
    return this.initializeOrNotify()
  }

  private async setupWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
    const workspaceFolderRoot = workspaceFolder.uri.fsPath
    const dvcRoots = await findDvcRootPaths(
      workspaceFolderRoot,
      this.cliReader.root(workspaceFolderRoot)
    )

    if (definedAndNonEmpty(dvcRoots)) {
      this.initializeDecorationProvidersEarly(dvcRoots)
      this.setProjectAvailability(true)
    }

    return this.dvcRoots.push(...dvcRoots)
  }

  private initializeDecorationProvidersEarly(dvcRoots: string[]) {
    dvcRoots.forEach(
      dvcRoot =>
        (this.decorationProviders[dvcRoot] = this.dispose.track(
          new DecorationProvider()
        ))
    )
  }

  private canRunCli() {
    return this.cliExecutor.help(this.config.firstWorkspaceFolderRoot)
  }

  private initializeOrNotify() {
    return this.canRunCli().then(
      () => {
        this.initialize()
      },
      () => {
        window.showInformationMessage(
          'DVC extension is unable to initialize as the cli is not available.\n' +
            'Update your config options to try again.'
        )
        this.status.setAvailability(false)
        return this.setCommandsAvailability(false)
      }
    )
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
      const repository = this.dispose.track(
        new Repository(
          dvcRoot,
          this.cliReader,
          this.decorationProviders[dvcRoot]
        )
      )

      this.dispose.track(
        onDidChangeFileSystem(
          dvcRoot,
          getRepositoryWatcher(repository, this.trackedExplorerTree)
        )
      )

      this.dvcRepositories[dvcRoot] = repository
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

    this.dispose.track(new OutputChannel([this.cliExecutor, this.cliReader]))

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
