import { window, commands, ExtensionContext } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import { IntegratedTerminal, runExperiment } from './IntegratedTerminal'
import { SourceControlManagement } from './views/SourceControlManagement'
import { Config } from './Config'
import { WebviewManager } from './webviews/WebviewManager'
import {
  getExperiments,
  initializeDirectory,
  checkout,
  checkoutRecursive
} from './cli/reader'
import { add } from './cli'

import {
  addFileChangeHandler,
  findDvcRootPaths,
  findDvcTrackedPaths
} from './fileSystem'
import { getAllUntracked, getExperimentsRefsPath } from './git'
import { ResourceLocator } from './ResourceLocator'
import { DecorationProvider } from './DecorationProvider'
import { Git } from './extensions/Git'

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
  private readonly decorationProvider: DecorationProvider
  private scm: SourceControlManagement[] = []
  private readonly git: Git

  private onChangeExperimentsUpdateWebview = async (): Promise<Disposable> => {
    const refsPath = await getExperimentsRefsPath(this.config.workspaceRoot)
    if (!refsPath) {
      throw new Error(
        'Live updates for the experiment table are not possible as the Git repo root was not found!'
      )
    }
    return addFileChangeHandler(refsPath, this.refreshExperimentsWebview)
  }

  private refreshExperimentsWebview = async () => {
    const experiments = await getExperiments({
      cwd: this.config.workspaceRoot,
      cliPath: this.config.dvcPath
    })
    return this.webviewManager.refreshExperiments(experiments)
  }

  private showExperimentsWebview = async () => {
    const webview = await this.webviewManager.findOrCreateExperiments()
    this.refreshExperimentsWebview()
    return webview
  }

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.resourceLocator = new ResourceLocator(context.extensionPath)

    this.git = this.dispose.track(new Git())
    this.config = new Config()

    this.decorationProvider = this.dispose.track(new DecorationProvider())

    this.config.ready.then(() => {
      this.git.ready.then(() => {
        this.git.repositories.forEach(async gitRepository => {
          const gitRoot = gitRepository.getRepositoryRoot()
          const dvcRoots = await findDvcRootPaths(gitRoot, this.config.dvcPath)
          dvcRoots.forEach(async dvcRoot => {
            const untracked = await getAllUntracked(dvcRoot)
            const scm = this.dispose.track(
              new SourceControlManagement(dvcRoot, untracked)
            )
            this.scm.push(scm)

            gitRepository.onDidChange(async () => {
              const untrackedChanges = await getAllUntracked(dvcRoot)
              return scm.updateUntracked(untrackedChanges)
            })
          })
        })
      })

      findDvcTrackedPaths(this.config.workspaceRoot, this.config.dvcPath).then(
        files => {
          this.decorationProvider.setTrackedFiles(files)
        }
      )
    })

    this.webviewManager = this.dispose.track(
      new WebviewManager(this.config, this.resourceLocator)
    )

    this.onChangeExperimentsUpdateWebview().then(disposable =>
      this.dispose.track(disposable)
    )

    this.dispose.track(IntegratedTerminal)

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
      commands.registerCommand('dvc.runExperiment', async () => {
        runExperiment()
        this.showExperimentsWebview()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
        initializeDirectory({
          cwd: fsPath,
          cliPath: this.config.dvcPath
        })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.add', ({ fsPath }) => {
        add({ fsPath, cliPath: this.config.dvcPath })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkout', ({ fsPath }) => {
        checkout({ cwd: fsPath, cliPath: this.config.dvcPath })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkoutRecursive', ({ fsPath }) => {
        checkoutRecursive({ cwd: fsPath, cliPath: this.config.dvcPath })
      })
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
