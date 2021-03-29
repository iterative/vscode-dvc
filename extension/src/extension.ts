import { workspace, window, commands, scm, Uri, ExtensionContext } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import { IntegratedTerminal, runExperiment } from './IntegratedTerminal'

import { Config } from './Config'
import { WebviewManager } from './webviews/WebviewManager'
import {
  getExperiments,
  initializeDirectory,
  checkout,
  checkoutRecursive
} from './cli/reader'
import { add } from './cli'

import { addFileChangeHandler, findDvcTrackedPaths } from './fileSystem'
import { getExperimentsRefsPath } from './git'
import { ResourceLocator } from './ResourceLocator'
import { DecorationProvider } from './DecorationProvider'

export { Disposable }

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
      cliPath: this.config.dvcCliPath
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

    this.config = new Config()

    this.decorationProvider = this.dispose.track(new DecorationProvider())

    this.config.ready.then(() => {
      findDvcTrackedPaths(
        this.config.workspaceRoot,
        this.config.dvcCliPath
      ).then(files => {
        this.decorationProvider.setTrackedFiles(files)
      })
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
        initializeDirectory({ cwd: fsPath, cliPath: this.config.dvcCliPath })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.add', ({ fsPath }) => {
        add({ fsPath, cliPath: this.config.dvcCliPath })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkout', ({ fsPath }) => {
        checkout({ cwd: fsPath, cliPath: this.config.dvcCliPath })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkoutRecursive', ({ fsPath }) => {
        checkoutRecursive({ cwd: fsPath, cliPath: this.config.dvcCliPath })
      })
    )

    this.dvcScmFilesView()
  }

  dvcScmFilesView(): void {
    const { workspaceFolders } = workspace
    if (!workspaceFolders) {
      return
    }

    workspaceFolders.forEach(folder => {
      const uri = `${folder.uri.fsPath}/`

      const c = this.dispose.track(
        scm.createSourceControl('dvc', 'DVC', Uri.file(uri))
      )
      c.acceptInputCommand = {
        command: 'workbench.action.output.toggleOutput',
        title: 'foo'
      }

      c.inputBox.visible = false

      c.statusBarCommands = [
        {
          command: 'test',
          title: 'DVC'
        }
      ]

      const resourceGroup = this.dispose.track(
        c.createResourceGroup('group1', 'Unchanged')
      )

      resourceGroup.resourceStates = [
        {
          resourceUri: Uri.file(`${uri}path/file.ts`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },

          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: Uri.file(`${uri}path/file2.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: Uri.file(`${uri}path/sub/file.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        }
      ]
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
