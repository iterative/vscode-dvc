import * as vscode from 'vscode'
import { join, relative } from 'path'
import { execDvcCmd, isDirOrFile } from './util'

export class ExplorerTreeViewItemProvider
  implements vscode.TreeDataProvider<DvcTrackedItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    DvcTrackedItem | undefined | void
  > = new vscode.EventEmitter<DvcTrackedItem | undefined | void>()

  readonly onDidChangeTreeData: vscode.Event<
    DvcTrackedItem | undefined | void
  > = this._onDidChangeTreeData.event

  readonly workspaceUri: vscode.Uri

  constructor(private workspaceRoot: string) {
    this.workspaceUri = vscode.Uri.file(this.workspaceRoot)
    vscode.workspace.onDidDeleteFiles(() => this.refresh())
    vscode.workspace.onDidCreateFiles(() => this.refresh())
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  openResource(resource: vscode.Uri): void {
    vscode.window.showTextDocument(resource)
  }

  async getChildren(element?: DvcTrackedItem): Promise<DvcTrackedItem[]> {
    if (element) {
      const children = await this.readDirectory(element.uri)
      return children.map(([name, type]) => ({
        uri: vscode.Uri.file(join(element.uri.fsPath, name)),
        type
      }))
    }

    if (this.workspaceRoot) {
      const children = await this.readDirectory(this.workspaceUri)
      children.sort((a, b) => {
        if (a[1] === b[1]) {
          return a[0].localeCompare(b[0])
        }
        return a[1] === vscode.FileType.Directory ? -1 : 1
      })

      return children.map(([name, type]) => ({
        uri: vscode.Uri.file(join(this.workspaceUri.fsPath, name)),
        type
      }))
    }

    return []
  }

  getTreeItem(element: DvcTrackedItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.uri,
      element.type === vscode.FileType.Directory
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    )

    if (element.type === vscode.FileType.File) {
      treeItem.command = {
        command: 'explorerTreeView.openFile',
        title: 'Open File',
        arguments: [element.uri]
      }
      treeItem.contextValue = 'file'
    }
    treeItem.resourceUri = element.uri.with({ scheme: 'dvcItem' })

    return treeItem
  }

  private async readDirectory(
    uri: vscode.Uri
  ): Promise<[string, vscode.FileType][]> {
    const children = await this.getTrackedFiles(
      `cd ${this.workspaceRoot} && dvc list . ${relative(
        this.workspaceRoot,
        uri.fsPath
      )} --dvc-only`
    )
    const result: [string, vscode.FileType][] = []

    for (let i = 0; i < children.length - 1; i++) {
      const child = children[i]
      const stat = await isDirOrFile(join(uri.fsPath, child))

      result.push([child, stat])
    }

    return Promise.resolve(result)
  }

  private async getTrackedFiles(cmd: string): Promise<string[]> {
    const res = await execDvcCmd(cmd)
    return res.split(/\r\n?|\n/)
  }
}
