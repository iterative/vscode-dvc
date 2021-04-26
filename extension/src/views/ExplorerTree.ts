import {
  Event,
  EventEmitter,
  FileType,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { join, relative } from 'path'
import { listDvcOnly } from '../cli/reader'
import { Config } from '../Config'
import { isDirectory } from '../fileSystem'

interface DvcTrackedItem {
  resourceUri: Uri
  type: FileType
}

export const isDirOrFile = (path: string): FileType => {
  try {
    if (isDirectory(path)) {
      return FileType.Directory
    }
    return FileType.File
  } catch (e) {
    return FileType.File
  }
}

export class ExplorerTreeViewItemProvider
  implements TreeDataProvider<DvcTrackedItem> {
  public dispose = Disposable.fn()

  private _onDidChangeTreeData: EventEmitter<
    DvcTrackedItem | undefined | void
  > = new EventEmitter<DvcTrackedItem | undefined | void>()

  private workspaceRoot: string
  private config: Config

  readonly onDidChangeTreeData: Event<DvcTrackedItem | undefined | void> = this
    ._onDidChangeTreeData.event

  readonly workspaceUri: Uri

  constructor(workspaceRoot: string, config: Config) {
    this.workspaceRoot = workspaceRoot
    this.config = config
    this.workspaceUri = Uri.file(this.workspaceRoot)
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  openResource(resource: Uri): void {
    window.showTextDocument(resource)
  }

  async getChildren(element?: DvcTrackedItem): Promise<DvcTrackedItem[]> {
    if (element) {
      const children = await this.readDirectory(element.resourceUri)
      return children.map(([name, type]) => ({
        resourceUri: Uri.file(join(element.resourceUri.fsPath, name)),
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
        resourceUri: Uri.file(join(this.workspaceUri.fsPath, name)),
        type
      }))
    }

    return []
  }

  getTreeItem(element: DvcTrackedItem): TreeItem {
    const treeItem = new TreeItem(
      element.resourceUri,
      element.type === FileType.Directory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    if (element.type === FileType.File) {
      treeItem.command = {
        command: 'explorerTreeView.openFile',
        title: 'Open File',
        arguments: [element.resourceUri]
      }
      treeItem.contextValue = 'file'
    }

    return treeItem
  }

  private async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    await this.config.ready
    const children = await listDvcOnly(
      {
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.dvcPath,
        cwd: uri.fsPath
      },
      relative(this.workspaceRoot, uri.fsPath)
    )

    const result = children.map(child => {
      const path = join(uri.fsPath, child)
      const type = isDirOrFile(path)
      return [child, type] as [string, FileType]
    })

    return result
  }
}
