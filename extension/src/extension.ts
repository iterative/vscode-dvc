import {
  workspace,
  window,
  commands,
  TreeDataProvider,
  ThemeIcon,
  TreeItemCollapsibleState,
  Command,
  scm,
  Uri,
  TreeItem,
  ExtensionContext
} from 'vscode'
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
  add,
  checkout,
  checkoutRecursive
} from './IntegratedTerminal'

import { Config } from './Config'
import { DvcWebviewManager } from './DvcWebviewManager'
import { getExperiments, inferDefaultOptions } from './dvcReader'

import { DVCPathStatusBarItem, selectDvcPath } from './DvcPath'
import { addFileChangeHandler } from './fileSystem'
import { getExperimentsRefsPath } from './git'

export { Disposable }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

export class Extension {
  public readonly dispose = Disposable.fn()

  private readonly config = new Config()

  private getDefaultCwd = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private dvcPathStatusBarItem: DVCPathStatusBarItem

  private readonly manager = this.dispose.track(
    new DvcWebviewManager(this.config)
  )

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
    const tableData = await this.getExperimentsTableData()
    this.manager.refreshAll(tableData)
  }

  private async getExperimentsTableData() {
    const dvcReaderOptions = await inferDefaultOptions(this.getDefaultCwd())
    return getExperiments(dvcReaderOptions)
  }

  constructor() {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.onChangeExperimentsUpdateWebview().then(disposable =>
      this.dispose.track(disposable)
    )

    this.dispose.track(IntegratedTerminal)

    this.dispose.track((this.dvcPathStatusBarItem = new DVCPathStatusBarItem()))

    // When hot-reload is active, make sure that you dispose everything when the extension is disposed!
    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dvc.dvcPath')) {
          this.dvcPathStatusBarItem.update()
        }
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.selectDvcPath', async () => selectDvcPath())
    )

    this.dispose.track(
      commands.registerCommand('dvc.showWebview', async () => {
        const dvcWebview = this.dispose.track(await this.manager.createNew())
        try {
          const tableData = await this.getExperimentsTableData()
          dvcWebview.showExperiments({ tableData })
        } catch (e) {
          dvcWebview.showExperiments({ errors: [e.toString()] })
        }
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.runExperiment', runExperiment)
    )

    this.dispose.track(
      commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
        initializeDirectory(fsPath)
      })
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

    this.dvcScmFilesView()
    this.dvcCommandView()
  }

  dvcCommandView(): void {
    interface TreeItemEntry {
      label: string
      command?: Command
    }

    class DVCTreeDataProvider implements TreeDataProvider<TreeItemEntry> {
      /* onDidChangeTreeData?:
				| Event<void | MyTreeItem | null | undefined>
				| undefined; */

      async getChildren(element?: TreeItemEntry): Promise<TreeItemEntry[]> {
        if (!element) {
          // Root
          return [
            {
              label: 'View Tree',
              command: {
                title: 'Webview Tree',
                command: 'dvc.showWebview'
              }
            },
            {
              label: 'Run Experiment',
              command: {
                title: 'Run Experiment',
                command: 'dvc.runExperiment'
              }
            }
          ]
        }
        return []
      }

      async getTreeItem(element: TreeItemEntry): Promise<TreeItem> {
        return {
          label: element.label,
          command: element.command,
          iconPath: ThemeIcon.File,
          collapsibleState: TreeItemCollapsibleState.None
        }
      }
    }

    this.dispose.track(
      window.createTreeView('dvc-tree', {
        treeDataProvider: new DVCTreeDataProvider(),
        canSelectMany: false
      })
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
    hotRequireExportedFn(module, Extension, HotExtension => new HotExtension())
  )
}

// export function deactivate(): void {}
