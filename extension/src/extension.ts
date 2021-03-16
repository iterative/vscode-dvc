import { workspace, window, commands, scm, Uri, ExtensionContext } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import {
  IntegratedTerminal,
  runExperiment,
  initializeDirectory,
  push,
  add,
  checkout,
  checkoutRecursive
} from './IntegratedTerminal'

import { Config } from './Config'
import { DvcWebviewManager } from './DvcWebviewManager'
import { getExperiments, inferDefaultOptions } from './dvcReader'

import { addFileChangeHandler } from './fileSystem'
import { getExperimentsRefsPath } from './git'
import { ResourceLocator } from './ResourceLocator'

import { ExplorerTreeViewItemProvider } from './DvcExplorerTreeView'
import { DvcDecorationProvider } from './DvcDecorationProvider'

export { Disposable }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

export class Extension {
  public readonly dispose = Disposable.fn()

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
  private readonly manager: DvcWebviewManager

  private getDefaultCwd = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private lastExperimentsOutputHash = ''

  private onChangeExperimentsUpdateWebview = async (): Promise<Disposable> => {
    const cwd = this.getDefaultCwd()
    const refsPath = await getExperimentsRefsPath(cwd)
    if (!refsPath) {
      throw new Error(
        'Live updates for the experiment table are not possible as the Git repo root was not found!'
      )
    }
    return addFileChangeHandler(refsPath, this.refreshWebviews)
  }

  private refreshWebviews = async () => {
    const { experiments, outputHash } = await this.getExperimentsTableData()
    if (outputHash !== this.lastExperimentsOutputHash) {
      this.lastExperimentsOutputHash = outputHash
      this.manager.refreshAll(experiments)
    }
  }

  private async getExperimentsTableData() {
    const dvcReaderOptions = await inferDefaultOptions(
      this.getDefaultCwd(),
      this.config.dvcPath
    )
    return getExperiments(dvcReaderOptions)
  }

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.resourceLocator = new ResourceLocator(context.extensionPath)

    this.config = new Config()

    this.manager = this.dispose.track(
      new DvcWebviewManager(this.config, this.resourceLocator)
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
        const dvcWebview = this.dispose.track(await this.manager.findOrCreate())
        try {
          const { experiments } = await this.getExperimentsTableData()
          dvcWebview.showExperiments({ tableData: experiments })
        } catch (e) {
          dvcWebview.showExperiments({ errors: [e.toString()] })
        }
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.runExperiment', async () => {
        runExperiment()
        commands.executeCommand('dvc.showExperiments')
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
        initializeDirectory(fsPath)
      })
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.push',
        (options: DvcTrackedItem | undefined) => {
          push(options)
        }
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.add', ({ fsPath }) => {
        add(fsPath)
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkout', ({ fsPath }) => {
        checkout(fsPath)
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkoutRecursive', ({ fsPath }) => {
        checkoutRecursive(fsPath)
      })
    )
    this.dvcFileDecorator()
    this.dvcExplorerView()
    this.dvcScmFilesView()
  }

  dvcFileDecorator(): void {
    this.dispose.track(
      window.registerFileDecorationProvider(new DvcDecorationProvider())
    )
  }

  dvcExplorerView(): void {
    const explorerView = new ExplorerTreeViewItemProvider(this.getDefaultCwd())
    this.dispose.track(
      window.registerTreeDataProvider('explorerTreeView', explorerView)
    )
    this.dispose.track(
      commands.registerCommand('explorerTreeView.openFile', resource =>
        explorerView.openResource(resource)
      )
    )
    this.dispose.track(
      commands.registerCommand('explorerTreeView.refreshEntry', () =>
        explorerView.refresh()
      )
    )
  }

  dvcScmFilesView(): void {
    const { workspaceFolders } = workspace
    if (!workspaceFolders) return

    workspaceFolders.forEach(folder => {
      const uri = `${folder.uri.fsPath}/`

      const c = this.dispose.track(
        scm.createSourceControl('dvc', 'DVC', Uri.file(uri))
      )
      c.acceptInputCommand = {
        command: 'workbench.action.output.toggleOutput',
        title: 'foo'
      }

      c.inputBox.placeholder = "Message (Ctrl+Enter to commit on 'master')"
      // ic.commitTemplate = "templatea";

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
