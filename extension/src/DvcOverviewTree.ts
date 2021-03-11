import * as vscode from 'vscode'
import * as fs from 'fs'
import { join } from 'path'
import * as cp from 'child_process'

export class OverviewTreeItemProvider
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
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  openResource(resource: vscode.Uri): void {
    vscode.window.showTextDocument(resource)
  }

  async getChildren(element?: DvcTrackedItem): Promise<DvcTrackedItem[]> {
    if (element) {
      const children = await this.readDirectory(element.uri, element.rel)
      return children.map(([name, type, rel]) => ({
        uri: vscode.Uri.file(join(element.uri.fsPath, name)),
        type,
        rel
      }))
    }

    if (this.workspaceRoot) {
      const children = await this.readDirectory(this.workspaceUri, '')
      children.sort((a, b) => {
        if (a[1] === b[1]) {
          return a[0].localeCompare(b[0])
        }
        return a[1] === vscode.FileType.Directory ? -1 : 1
      })

      return children.map(([name, type, rel]) => ({
        uri: vscode.Uri.file(join(this.workspaceUri.fsPath, name)),
        type,
        rel
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

    return treeItem
  }

  private async readDirectory(
    uri: vscode.Uri,
    rel: string
  ): Promise<[string, vscode.FileType, string][]> {
    const children = await this.execDvc(
      `cd ${this.workspaceRoot} && dvc list . ${rel || ''} --dvc-only`
    )
    const result: [string, vscode.FileType, string][] = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const stat = await this.isDir(join(uri.fsPath, child))
      const relative = join(rel, child)

      result.push([child, stat, relative])
    }

    return Promise.resolve(result)
  }

  private execDvc(cmd: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      cp.exec(cmd, (err, out) => {
        if (err) {
          return reject(err)
        }
        const arr = out.split('\r\n')
        arr.pop()
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
}
