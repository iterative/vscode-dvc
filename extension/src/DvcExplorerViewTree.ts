import * as vscode from 'vscode'
import * as fs from 'fs'
import { join, relative } from 'path'
import * as cp from 'child_process'
import { workspace } from 'vscode'

export class ExplorerViewTreeItemProvider
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
    workspace.onDidDeleteFiles(() => this.refresh())
    workspace.onDidCreateFiles(() => this.refresh())
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
        command: 'dvcOverview.openFile',
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
    const children = await this.execDvc(
      `cd ${this.workspaceRoot} && dvc list . ${this.getRel(uri)} --dvc-only`
    )
    const result: [string, vscode.FileType][] = []

    for (let i = 0; i < children.length - 1; i++) {
      const child = children[i]
      const stat = await this.isDir(join(uri.fsPath, child))

      result.push([child, stat])
    }

    return Promise.resolve(result)
  }

  private execDvc(cmd: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      cp.exec(cmd, (err, out) => {
        if (err) {
          return reject(err)
        }
        const arr = out.split(/\r\n?|\n/)

        return resolve(arr)
      })
    })
  }

  private isDir(path: fs.PathLike): vscode.FileType {
    try {
      const stat = fs.lstatSync(path)
      if (stat.isDirectory()) {
        return vscode.FileType.Directory
      }
      return vscode.FileType.File
    } catch (e) {
      return vscode.FileType.File
    }
  }

  private getRel(uri: vscode.Uri): string {
    return relative(this.workspaceRoot, uri.fsPath)
  }
}
