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
import { definedAndNonEmpty } from '../util'

export class ExplorerTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  private changeTreeDataEventEmitter: EventEmitter<string | void>
  readonly onDidChangeTreeData: Event<string | void>

  private config: Config
  private dvcRoots: string[] = []

  private pathRoots: Record<string, string> = {}

  public refresh(path: string): void {
    this.changeTreeDataEventEmitter.fire(dirname(path))
  }

  public setDvcRoots(dvcRoots: string[]) {
    this.dvcRoots = dvcRoots
    this.changeTreeDataEventEmitter.fire()
  }

  public openResource(resource: Uri): void {
    window.showTextDocument(resource)
  }

  public async getChildren(element?: string): Promise<string[]> {
    if (element) {
      return this.readDirectory(this.pathRoots[element], element)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      const rootElements = await Promise.all(
        this.dvcRoots.map(async dvcRoot => this.readDirectory(dvcRoot, dvcRoot))
      )
      return rootElements
        .reduce((a, b) => a.concat(b), [])
        .sort((a, b) => {
          const aIsDirectory = isDirectory(a)
          const bIsDirectory = isDirectory(b)
          if (aIsDirectory === bIsDirectory) {
            return a.localeCompare(b)
          }
          return aIsDirectory ? -1 : 1
        })
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

  private async readDirectory(root: string, path: string): Promise<string[]> {
    await this.config.ready
    const children = await listDvcOnly(
      {
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.dvcPath,
        cwd: path
      },
      relative(root, path)
    )

    return children.map(child => {
      const childPath = join(path, child)
      this.pathRoots[childPath] = root
      return childPath
    })
  }

  constructor(config: Config) {
    this.config = config

    this.changeTreeDataEventEmitter = new EventEmitter<string | void>()
    this.onDidChangeTreeData = this.changeTreeDataEventEmitter.event
  }
}
