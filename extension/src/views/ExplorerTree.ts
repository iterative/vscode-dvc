import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { dirname, join, relative } from 'path'
import { listDvcOnly } from '../cli/reader'
import { Config } from '../Config'
import { isDirectory } from '../fileSystem'

export class ExplorerTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  private changeTreeDataEventEmitter: EventEmitter<string>
  readonly onDidChangeTreeData: Event<string>

  private workspaceRoot: string
  private config: Config

  refresh(path: string): void {
    this.changeTreeDataEventEmitter.fire(dirname(path))
  }

  openResource(resource: Uri): void {
    window.showTextDocument(resource)
  }

  async getChildren(element?: string): Promise<string[]> {
    if (element) {
      return this.readDirectory(element)
    }

    if (this.workspaceRoot) {
      const children = await this.readDirectory(this.workspaceRoot)
      children.sort((a, b) => {
        const aIsDirectory = isDirectory(a)
        const bIsDirectory = isDirectory(b)
        if (aIsDirectory === bIsDirectory) {
          return a.localeCompare(b)
        }
        return aIsDirectory ? -1 : 1
      })

      return children
    }

    return []
  }

  getTreeItem(element: string): TreeItem {
    const elementIsDirectory = isDirectory(element)
    const resourceUri = Uri.file(element)
    const treeItem = new TreeItem(
      resourceUri,
      elementIsDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    if (!elementIsDirectory) {
      treeItem.command = {
        command: 'explorerTreeView.openFile',
        title: 'Open File',
        arguments: [resourceUri]
      }
      treeItem.contextValue = 'file'
    }

    return treeItem
  }

  private async readDirectory(path: string): Promise<string[]> {
    await this.config.ready
    const children = await listDvcOnly(
      {
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.dvcPath,
        cwd: path
      },
      relative(this.workspaceRoot, path)
    )

    return children.map(child => join(path, child))
  }

  constructor(workspaceRoot: string, config: Config) {
    this.workspaceRoot = workspaceRoot
    this.config = config

    this.changeTreeDataEventEmitter = new EventEmitter<string>()
    this.onDidChangeTreeData = this.changeTreeDataEventEmitter.event
  }
}
