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
import { join, relative } from 'path'
import { listDvcOnly } from '../cli/reader'
import { Config } from '../Config'
import { exists, isDirectory } from '../fileSystem'

interface DvcTrackedItem {
  uri: Uri
  type: FileType
}

export const isDirOrFile = (path: string): FileType => {
  try {
    if (!exists(path)) {
      return FileType.Unknown
    }
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
      element.type === FileType.Directory || element.type === FileType.Unknown
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
    await this.config.ready
    const children = await listDvcOnly(
      {
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.dvcPath,
        cwd: uri.fsPath
      },
      relative(this.workspaceRoot, uri.fsPath)
    )

    const result: [string, FileType][] = children.map(child => {
      const path = join(uri.fsPath, child)
      const stat = isDirOrFile(path)
      return [child, stat]
    })

    return Promise.resolve(result)
  }
}
