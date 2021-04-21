import {
  Event,
  EventEmitter,
  FileType,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window,
  workspace
} from 'vscode'
import { join } from 'path'
import { lstatSync } from 'fs-extra'
import { listDvcOnly } from '../cli/reader'

interface DvcTrackedItem {
  uri: Uri
  type: FileType
}

export const isDirOrFile = (path: string): FileType => {
  try {
    const stat = lstatSync(path)
    if (stat.isDirectory()) {
      return FileType.Directory
    }
    return FileType.File
  } catch (e) {
    return FileType.File
  }
}

export class ExplorerTreeViewItemProvider
  implements TreeDataProvider<DvcTrackedItem> {
  private _onDidChangeTreeData: EventEmitter<
    DvcTrackedItem | undefined | void
  > = new EventEmitter<DvcTrackedItem | undefined | void>()

  readonly onDidChangeTreeData: Event<DvcTrackedItem | undefined | void> = this
    ._onDidChangeTreeData.event

  readonly workspaceUri: Uri

  constructor(private workspaceRoot: string) {
    this.workspaceUri = Uri.file(this.workspaceRoot)
    workspace.onDidDeleteFiles(() => this.refresh())
    workspace.onDidCreateFiles(() => this.refresh())
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  openResource(resource: Uri): void {
    window.showTextDocument(resource)
  }

  async getChildren(element?: DvcTrackedItem): Promise<DvcTrackedItem[]> {
    if (element) {
      const children = await this.readDirectory(element.uri)
      return children.map(([name, type]) => ({
        uri: Uri.file(join(element.uri.fsPath, name)),
        type
      }))
    }

    if (this.workspaceRoot) {
      const children = await this.readDirectory(this.workspaceUri)
      children.sort((a, b) => {
        if (a[1] === b[1]) {
          return a[0].localeCompare(b[0])
        }
        return a[1] === FileType.Directory ? -1 : 1
      })

      return children.map(([name, type]) => ({
        uri: Uri.file(join(this.workspaceUri.fsPath, name)),
        type
      }))
    }

    return []
  }

  getTreeItem(element: DvcTrackedItem): TreeItem {
    const treeItem = new TreeItem(
      element.uri,
      element.type === FileType.Directory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    if (element.type === FileType.File) {
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

  private async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    const children = await listDvcOnly({
      pythonBinPath: undefined,
      cliPath: undefined,
      cwd: uri.fsPath
    })

    const result: [string, FileType][] = []

    for (let i = 0; i < children.length - 1; i++) {
      const child = children[i]
      const stat = isDirOrFile(join(uri.fsPath, child))

      result.push([child, stat])
    }

    return Promise.resolve(result)
  }
}
