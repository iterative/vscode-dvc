import {
  window,
  commands,
  ExtensionContext,
  workspace,
  WorkspaceFolder,
  Uri
} from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import { Config } from './Config'
import { WebviewManager } from './webviews/WebviewManager'
import { getExperiments } from './cli/reader'
import { Commands } from './cli/commands'
import { Runner } from './cli/Runner'
import registerCliCommands from './cli/register'
import {
  addOnFileSystemChangeHandler,
  findDvcRootPaths,
  pickSingleRepositoryRoot
} from './fileSystem'
import { ResourceLocator } from './ResourceLocator'
import { DecorationProvider } from './Repository/DecorationProvider'
import { GitExtension } from './extensions/Git'
import { resolve } from 'path'
import { Repository } from './Repository'
import { ExplorerTreeViewItemProvider } from './views/ExplorerTree'

export { Disposable, Disposer }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

export class Extension {
  public readonly dispose = Disposable.fn()

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
  private readonly webviewManager: WebviewManager
  private dvcRoots: string[] = []
  private decorationProviders: Record<string, DecorationProvider> = {}
  private dvcRepositories: Record<string, Repository> = {}
  private explorerView: ExplorerTreeViewItemProvider
  private readonly gitExtension: GitExtension
  private readonly runner: Runner

  private async setupWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
    const workspaceRoot = workspaceFolder.uri.fsPath
    const dvcRoots = await findDvcRootPaths({
      cliPath: this.config.dvcPath,
      cwd: workspaceRoot,
      pythonBinPath: this.config.pythonBinPath
    })

    this.initializeDecorationProvidersEarly(dvcRoots)

    this.initializeDvcRepositories(dvcRoots)

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

  private initializeDvcRepositories(dvcRoots: string[]) {
    this.config.ready.then(() =>
      dvcRoots.forEach(dvcRoot => {
        const repository = this.dispose.track(
          new Repository(
            dvcRoot,
            this.config,
            this.decorationProviders[dvcRoot]
          )
        )

        this.dispose.track(
          addOnFileSystemChangeHandler(dvcRoot, () => {
            repository.updateState()
          })
        )

        this.dvcRepositories[dvcRoot] = repository
      })
    )
  }

  private onChangeExperimentsUpdateWebview = async (
    gitRoot: string
  ): Promise<Disposable> => {
    if (!gitRoot) {
      throw new Error(
        'Live updates for the experiment table are not possible as the Git repo root was not found!'
      )
    }
    const refsPath = resolve(gitRoot, '.git', 'refs', 'exps')
    return addOnFileSystemChangeHandler(
      refsPath,
      this.refreshExperimentsWebview
    )
  }

  private refreshExperimentsWebview = async () => {
    const experiments = await getExperiments({
      pythonBinPath: this.config.pythonBinPath,
      cliPath: this.config.dvcPath,
      cwd: this.config.workspaceRoot
    })
    return this.webviewManager.refreshExperiments(experiments)
  }

  private showExperimentsWebview = async () => {
    const webview = await this.webviewManager.findOrCreateExperiments()
    this.refreshExperimentsWebview()
    return webview
  }

  private async runExperimentCommand(
    command: Commands,
    context?: { rootUri?: Uri }
  ) {
    const dvcRoot = await pickSingleRepositoryRoot(
      {
        cliPath: this.config.dvcPath,
        cwd: this.config.workspaceRoot,
        pythonBinPath: this.config.pythonBinPath
      },
      context?.rootUri?.fsPath
    )
    if (dvcRoot) {
      this.runner.run(command, dvcRoot)
      this.showExperimentsWebview()
    }
  }

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.resourceLocator = new ResourceLocator(context.extensionUri)

    this.config = this.dispose.track(new Config())

    this.runner = this.dispose.track(new Runner(this.config))

    Promise.all(
      (workspace.workspaceFolders || []).map(async workspaceFolder =>
        this.setupWorkspaceFolder(workspaceFolder)
      )
    )

    this.webviewManager = this.dispose.track(
      new WebviewManager(this.config, this.resourceLocator)
    )

    registerCliCommands(this.config, this.dispose)

    // When hot-reload is active, make sure that you dispose everything when the extension is disposed!
    this.dispose.track(
      commands.registerCommand('dvc.selectDvcPath', async () =>
        this.config.selectDvcPath()
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.showExperiments', async () => {
        return this.showExperimentsWebview()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.runExperiment', async context =>
        this.runExperimentCommand(Commands.EXPERIMENT_RUN, context)
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.runResetExperiment', async context =>
        this.runExperimentCommand(Commands.EXPERIMENT_RUN_RESET, context)
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.runQueuedExperiments', async context =>
        this.runExperimentCommand(Commands.EXPERIMENT_RUN_ALL, context)
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.stopRunningExperiment', () =>
        this.runner.stop()
      )
    )

    this.explorerView = new ExplorerTreeViewItemProvider(
      this.config.workspaceRoot,
      this.config
    )
    this.dispose.track(
      window.registerTreeDataProvider('explorerTreeView', this.explorerView)
    )
    this.dispose.track(
      commands.registerCommand('explorerTreeView.openFile', resource =>
        this.explorerView.openResource(resource)
      )
    )
    addOnFileSystemChangeHandler(this.config.workspaceRoot, () => {
      this.explorerView.refresh()
    })

    this.gitExtension = this.dispose.track(new GitExtension())

    this.gitExtension.ready.then(() => {
      this.gitExtension.repositories.forEach(async gitExtensionRepository => {
        await this.config.ready
        const gitRoot = gitExtensionRepository.getRepositoryRoot()

        this.onChangeExperimentsUpdateWebview(gitRoot).then(disposable =>
          this.dispose.track(disposable)
        )

        const dvcRoots = await findDvcRootPaths({
          cliPath: this.config.dvcPath,
          cwd: gitRoot,
          pythonBinPath: this.config.pythonBinPath
        })
        dvcRoots.forEach(async dvcRoot => {
          const repository = this.dvcRepositories[dvcRoot]

          this.dispose.track(
            gitExtensionRepository.onDidChange(() => {
              repository?.updateState()
            })
          )
        })
      })
    })
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
