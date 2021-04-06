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
import { getExperiments } from './cli'

import {
  addFileChangeHandler,
  findDvcRootPaths,
  findDvcTrackedPaths
} from './fileSystem'
import { getAllUntracked } from './git'
import { ResourceLocator } from './ResourceLocator'
import { DecorationProvider } from './DecorationProvider'
import { GitExtension } from './extensions/Git'
import { resolve } from 'path'

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
  private readonly scm: SourceControlManagement[] = []
  private readonly gitExtension: GitExtension

  private onChangeExperimentsUpdateWebview = async (
    gitRoot: string
  ): Promise<Disposable> => {
    if (!gitRoot) {
      throw new Error(
        'Live updates for the experiment table are not possible as the Git repo root was not found!'
      )
    }
    const refsPath = resolve(gitRoot, '.git', 'refs', 'exps')
    return addFileChangeHandler(refsPath, this.refreshExperimentsWebview)
  }

  private refreshExperimentsWebview = async () => {
    const experiments = await getExperiments(this.config)
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

    this.config = this.dispose.track(new Config())

    this.decorationProvider = this.dispose.track(new DecorationProvider())

    findDvcTrackedPaths(this.config).then(files => {
      this.decorationProvider.setTrackedFiles(files)
    })

    this.webviewManager = this.dispose.track(
      new WebviewManager(this.config, this.resourceLocator)
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

    this.gitExtension = this.dispose.track(new GitExtension())

    this.gitExtension.ready.then(() => {
      this.gitExtension.repositories.forEach(async gitExtensionRepository => {
        const gitRoot = gitExtensionRepository.getRepositoryRoot()

        this.onChangeExperimentsUpdateWebview(gitRoot).then(disposable =>
          this.dispose.track(disposable)
        )

        const dvcRoots = await findDvcRootPaths(this.config, gitRoot)
        dvcRoots.forEach(async dvcRoot => {
          const untracked = await getAllUntracked(dvcRoot)
          const scm = this.dispose.track(
            new SourceControlManagement(dvcRoot, untracked)
          )
          this.scm.push(scm)

          gitExtensionRepository.onDidUntrackedChange(async () => {
            const untrackedChanges = await getAllUntracked(dvcRoot)
            return scm.updateUntracked(untrackedChanges)
          })
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
