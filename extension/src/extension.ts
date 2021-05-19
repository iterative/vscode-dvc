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
import { Config } from './Config'
import { WebviewSerializer } from './WebviewSerializer'
import { Experiments } from './Experiments'
import { registerExperimentCommands } from './Experiments/commands/register'
import { registerRepositoryCommands } from './Repository/commands/register'
import {
  findDvcRootPaths,
  onDidChangeFileSystem,
  onDidChangeFileType
} from './fileSystem'
import { ResourceLocator } from './ResourceLocator'
import { DecorationProvider } from './Repository/DecorationProvider'
import { GitExtension } from './extensions/Git'
import { Repository } from './Repository'
import { TrackedExplorerTree } from './fileSystem/views/TrackedExplorerTree'
import { canRunCli } from './cli/executor'
import { setContextValue } from './vscode/context'
import { definedAndNonEmpty } from './util'
import { Runner } from './cli/Runner'

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
  private readonly runner: Runner
  private readonly gitExtension: GitExtension

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
    return this.initializeOrNotify()
  }

  private async setupWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
    const workspaceRoot = workspaceFolder.uri.fsPath
    const dvcRoots = await findDvcRootPaths({
      cliPath: this.config.getCliPath(),
      cwd: workspaceRoot,
      pythonBinPath: this.config.pythonBinPath
    })

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

  private initializeOrNotify() {
    return canRunCli({
      cliPath: this.config.getCliPath(),
      pythonBinPath: this.config.pythonBinPath,
      cwd: this.config.workspaceRoot
    }).then(
      () => {
        this.initialize()
      },
      () => {
        window.showInformationMessage(
          'DVC extension is unable to initialize as the cli is not available.\n' +
            'Update your config options to try again.'
        )
        return this.setCommandsAvailability(false)
      }
    )
  }

  private initialize() {
    this.initializeDvcRepositories()

    this.trackedExplorerTree.initialize(this.dvcRoots)

    this.initializeExperiments()

    this.initializeGitRepositories()

    return this.setCommandsAvailability(true)
  }

  private initializeDvcRepositories() {
    this.dvcRoots.forEach(dvcRoot => {
      const repository = this.dispose.track(
        new Repository(dvcRoot, this.config, this.decorationProviders[dvcRoot])
      )

      this.dispose.track(
        onDidChangeFileType(dvcRoot, ['*.dvc', 'dvc.lock', 'dvc.yaml'], () => {
          repository.resetState()
          this.trackedExplorerTree.reset()
        })
      )

      this.dispose.track(
        onDidChangeFileSystem(dvcRoot, (path: string) => {
          repository.updateState()
          this.trackedExplorerTree.refresh(path)
        })
      )

      this.dvcRepositories[dvcRoot] = repository
    })
  }

  private initializeExperiments() {
    this.experiments.reset()
    this.experiments.create(this.dvcRoots, this.resourceLocator)
  }

  private async initializeGitRepositories() {
    await Promise.all([this.experiments.isReady(), this.gitExtension.isReady()])
    this.gitExtension.repositories.forEach(async gitExtensionRepository => {
      const gitRoot = gitExtensionRepository.getRepositoryRoot()

      const dvcRoots = await findDvcRootPaths({
        cliPath: this.config.getCliPath(),
        cwd: gitRoot,
        pythonBinPath: this.config.pythonBinPath
      })

      dvcRoots.forEach(dvcRoot => {
        const repository = this.dvcRepositories[dvcRoot]

        this.experiments.onDidChangeData(dvcRoot, gitRoot)

        this.dispose.track(
          gitExtensionRepository.onDidChange(() => {
            repository?.updateState()
          })
        )
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

    this.runner = this.dispose.track(new Runner(this.config))

    this.experiments = this.dispose.track(new Experiments(this.config))

    this.gitExtension = this.dispose.track(new GitExtension())

    this.trackedExplorerTree = this.dispose.track(
      new TrackedExplorerTree(this.config, this.workspaceChanged)
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

    this.dispose.track(
      registerExperimentCommands(this.config, this.experiments, this.runner)
    )

    this.dispose.track(registerRepositoryCommands(this.config))

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
