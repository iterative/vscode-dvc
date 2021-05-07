import {
  window,
  commands,
  ExtensionContext,
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
import { WebviewManager } from './webviews/WebviewManager'
import { Experiments } from './experiments'

import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands
} from './cli/args'
import { Runner } from './cli/Runner'
import registerCliCommands from './cli/register'
import {
  addOnFileSystemChangeHandler,
  addOnFileTypeChangeHandler,
  findDvcRootPaths,
  pickSingleRepositoryRoot
} from './fileSystem'
import { ResourceLocator } from './ResourceLocator'
import { DecorationProvider } from './Repository/DecorationProvider'
import { GitExtension } from './extensions/Git'
import { resolve } from 'path'
import { Repository } from './Repository'
import { TrackedExplorerTree } from './views/TrackedExplorerTree'
import { canRunCli } from './cli/executor'
import { setContextValue } from './vscode/context'

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
  private readonly trackedExplorerTree: TrackedExplorerTree
  private readonly gitExtension: GitExtension
  private readonly runner: Runner
  private readonly experiments: Experiments

  private async setupWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
    const workspaceRoot = workspaceFolder.uri.fsPath
    const dvcRoots = await findDvcRootPaths({
      cliPath: this.config.getCliPath(),
      cwd: workspaceRoot,
      pythonBinPath: this.config.pythonBinPath
    })

    this.initializeDecorationProvidersEarly(dvcRoots)

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
    this.initializeDvcRepositories(this.dvcRoots)

    this.trackedExplorerTree.initialize(this.dvcRoots)

    this.initializeGitRepositories()

    return this.setCommandsAvailability(true)
  }

  private initializeDvcRepositories(dvcRoots: string[]) {
    dvcRoots.forEach(dvcRoot => {
      const repository = this.dispose.track(
        new Repository(dvcRoot, this.config, this.decorationProviders[dvcRoot])
      )

      this.dispose.track(
        addOnFileTypeChangeHandler(
          dvcRoot,
          ['*.dvc', 'dvc.lock', 'dvc.yaml'],
          () => {
            repository.resetState()
            this.trackedExplorerTree.reset()
          }
        )
      )

      this.dispose.track(
        addOnFileSystemChangeHandler(dvcRoot, (path: string) => {
          repository.updateState()
          this.trackedExplorerTree.refresh(path)
        })
      )

      this.dvcRepositories[dvcRoot] = repository
    })
  }

  private async initializeGitRepositories() {
    await this.gitExtension.isReady()
    this.gitExtension.repositories.forEach(async gitExtensionRepository => {
      const gitRoot = gitExtensionRepository.getRepositoryRoot()

      this.dispose.track(this.onChangeExperimentsUpdateWebview(gitRoot))

      const dvcRoots = await findDvcRootPaths({
        cliPath: this.config.getCliPath(),
        cwd: gitRoot,
        pythonBinPath: this.config.pythonBinPath
      })

      dvcRoots.forEach(dvcRoot => {
        const repository = this.dvcRepositories[dvcRoot]

        this.dispose.track(
          gitExtensionRepository.onDidChange(() => {
            repository?.updateState()
          })
        )
      })
    })
  }

  private onChangeExperimentsUpdateWebview = (gitRoot: string): Disposable => {
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

  private refreshExperimentsWebview = async () =>
    this.webviewManager.refreshExperiments(await this.experiments.update())

  private showExperimentsWebview = async () => {
    const webview = await this.webviewManager.findOrCreateExperiments()
    await this.refreshExperimentsWebview()
    return webview
  }

  private async runExperimentCommand(...args: Args) {
    const dvcRoot = await pickSingleRepositoryRoot({
      cliPath: this.config.getCliPath(),
      cwd: this.config.workspaceRoot,
      pythonBinPath: this.config.pythonBinPath
    })

    if (dvcRoot) {
      await this.showExperimentsWebview()
      this.runner.run(dvcRoot, ...args)
      const listener = this.dispose.track(
        this.runner.onDidComplete(() => {
          this.refreshExperimentsWebview()
          this.dispose.untrack(listener)
          listener.dispose()
        })
      )
    }
  }

  private setCommandsAvailability(available: boolean) {
    setContextValue('dvc.commands.available', available)
  }

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.setCommandsAvailability(false)

    this.resourceLocator = new ResourceLocator(context.extensionUri)

    this.config = this.dispose.track(new Config())

    this.gitExtension = this.dispose.track(new GitExtension())

    this.runner = this.dispose.track(new Runner(this.config))

    this.experiments = this.dispose.track(new Experiments(this.config))

    this.trackedExplorerTree = this.dispose.track(
      new TrackedExplorerTree(this.config)
    )

    this.dispose.track(
      window.registerTreeDataProvider(
        'dvc.views.trackedExplorerTree',
        this.trackedExplorerTree
      )
    )

    Promise.all([
      (workspace.workspaceFolders || []).map(workspaceFolder =>
        this.setupWorkspaceFolder(workspaceFolder)
      ),
      this.config.isReady()
    ]).then(() => this.initializeOrNotify())

    this.config.onDidChangeExecutionDetails(() => this.initializeOrNotify())

    this.webviewManager = this.dispose.track(
      new WebviewManager(this.config, this.resourceLocator)
    )

    registerCliCommands(this.config, this.dispose)

    // When hot-reload is active, make sure that you dispose everything when the extension is disposed!
    this.dispose.track(
      commands.registerCommand('dvc.selectDvcPath', () =>
        this.config.selectDvcPath()
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.showExperiments', () => {
        return this.showExperimentsWebview()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.runExperiment', () =>
        this.runExperimentCommand(Command.EXPERIMENT, ExperimentSubCommands.RUN)
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.runResetExperiment', () =>
        this.runExperimentCommand(
          Command.EXPERIMENT,
          ExperimentSubCommands.RUN,
          ExperimentFlag.RESET
        )
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.runQueuedExperiments', () =>
        this.runExperimentCommand(
          Command.EXPERIMENT,
          ExperimentSubCommands.RUN,
          ExperimentFlag.RUN_ALL
        )
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.stopRunningExperiment', () =>
        this.runner.stop()
      )
    )
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
