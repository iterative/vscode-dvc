import * as vscode from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'

import { Config } from './Config'
import { DvcWebviewManager } from './DvcWebviewManager'
import {
  getExperiments,
  inferDefaultOptions,
  DVCExperimentsRepoJSONOutput
} from './DvcReader'
import { DVCExecutableStatusBarItem, selectExecutable } from './DvcExecutable'

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

const updateInterval = 3000

export class Extension {
  public readonly dispose = Disposable.fn()

  private readonly config = new Config()

  private experimentsDataPromise: Promise<DVCExperimentsRepoJSONOutput> | null = null

  private lastTableUpdate?: number = undefined

  private dvcExecutableStatusBarItem: DVCExecutableStatusBarItem

  private readonly manager = this.dispose.track(
    new DvcWebviewManager(this.config)
  )

  private async updateCachedTable() {
    const { workspaceFolders } = vscode.workspace
    if (!workspaceFolders || workspaceFolders.length === 0)
      throw new Error('There are no folders in the Workspace to operate on!')
    const dvcReaderOptions = await inferDefaultOptions(
      workspaceFolders[0].uri.fsPath
    )
    this.experimentsDataPromise = getExperiments(dvcReaderOptions)
    this.lastTableUpdate = Date.now()
    return this.experimentsDataPromise
  }

  private async getCachedTable() {
    if (
      !this.lastTableUpdate ||
      Date.now() - this.lastTableUpdate >= updateInterval
    )
      await this.updateCachedTable()
    return this.experimentsDataPromise
  }

  constructor() {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(vscode.window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.dispose.track(
      (this.dvcExecutableStatusBarItem = new DVCExecutableStatusBarItem())
    )

    // When hot-reload is active, make sure that you dispose everything when the extension is disposed!
    this.dispose.track(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dvc.dvcPath')) {
          this.dvcExecutableStatusBarItem.update()
        }
      })
    )

    this.dispose.track(
      vscode.commands.registerCommand('dvc-integration.selectExecutable', () =>
        selectExecutable()
      )
    )

    this.dispose.track(
      vscode.commands.registerCommand(
        'dvc-integration.showWebview',
        async () => {
          const dvcWebview = this.dispose.track(await this.manager.createNew())
          try {
            const tableData = await this.getCachedTable()
            dvcWebview.showExperiments({ tableData })
          } catch (e) {
            dvcWebview.showExperiments({ errors: [e.toString()] })
          }
        }
      )
    )

    this.dispose.track(
      vscode.commands.registerCommand('dvc-integration.runExperiment', () => {
        const terminal = vscode.window.createTerminal('DVC')
        terminal.sendText('dvc exp run')
        terminal.show()
      })
    )

    this.dvcScmFilesView()
    this.dvcCommandView()
  }

  dvcCommandView(): void {
    interface TreeItemEntry {
      label: string
      command?: vscode.Command
    }

    class DVCTreeDataProvider
      implements vscode.TreeDataProvider<TreeItemEntry> {
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
                command: 'dvc-integration.showWebview'
              }
            },
            {
              label: 'Run Experiment',
              command: {
                title: 'Run Experiment',
                command: 'dvc-integration.runExperiment'
              }
            }
          ]
        }
        return []
      }

      async getTreeItem(element: TreeItemEntry): Promise<vscode.TreeItem> {
        return {
          label: element.label,
          command: element.command,
          iconPath: vscode.ThemeIcon.File,
          collapsibleState: vscode.TreeItemCollapsibleState.None
        }
      }
    }

    this.dispose.track(
      vscode.window.createTreeView('dvc-tree', {
        treeDataProvider: new DVCTreeDataProvider(),
        canSelectMany: false
      })
    )
  }

  dvcScmFilesView(): void {
    const { workspaceFolders } = vscode.workspace
    if (!workspaceFolders) return

    workspaceFolders.forEach(folder => {
      const uri = `${folder.uri.fsPath}/`

      const c = this.dispose.track(
        vscode.scm.createSourceControl('dvc', 'DVC', vscode.Uri.file(uri))
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
          resourceUri: vscode.Uri.file(`${uri}path/file.ts`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },

          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: vscode.Uri.file(`${uri}path/file2.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: vscode.Uri.file(`${uri}path/sub/file.txt`),
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

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    hotRequireExportedFn(module, Extension, HotExtension => new HotExtension())
  )
}

// export function deactivate(): void {}
