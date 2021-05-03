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
import { definedAndNonEmpty } from '../util'

interface TrackedPath {
  path: string
  isDirectory: boolean
}

export class TrackedExplorerTree implements TreeDataProvider<TrackedPath> {
  public dispose = Disposable.fn()

  private changeTreeDataEventEmitter: EventEmitter<TrackedPath | void>

  readonly onDidChangeTreeData: Event<TrackedPath | void>

  private config: Config
  private dvcRoots: string[] = []

  private pathRoots: Record<string, string> = {}

  public refresh(path: string): void {
    this.changeTreeDataEventEmitter.fire({
      path: dirname(path),
      isDirectory: true
    })
  }

  public setDvcRoots(dvcRoots: string[]) {
    this.dvcRoots = dvcRoots
    this.changeTreeDataEventEmitter.fire()
  }

  public openResource(resource: Uri): void {
    window.showTextDocument(resource)
  }

  private async getRootElements() {
    const rootElements = await Promise.all(
      this.dvcRoots.map(dvcRoot => this.readDirectory(dvcRoot, dvcRoot))
    )
    return rootElements
      .reduce((a, b) => a.concat(b), [])
      .sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.path.localeCompare(b.path)
        }
        return a.isDirectory ? -1 : 1
      })
  }

  public getChildren(element?: TrackedPath): Promise<TrackedPath[]> {
    if (element) {
      return this.readDirectory(this.pathRoots[element.path], element.path)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      return this.getRootElements()
    }

    return Promise.resolve([])
  }

  public getTreeItem(element: TrackedPath): TreeItem {
    const resourceUri = Uri.file(element.path)
    const treeItem = new TreeItem(
      resourceUri,
      element.isDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    if (!element.isDirectory) {
      treeItem.command = {
        command: 'dvc.views.trackedExplorerTree.openFile',
        title: 'Open File',
        arguments: [resourceUri]
      }
      treeItem.contextValue = 'file'
    }

    return treeItem
  }

  private async readDirectory(
    root: string,
    path: string
  ): Promise<TrackedPath[]> {
    await this.config.ready
    const relatives = await listDvcOnly(
      {
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.dvcPath,
        cwd: path
      },
      relative(root, path)
    )

    return relatives.map(relative => {
      const absolutePath = join(path, relative.path)
      this.pathRoots[absolutePath] = root
      return { path: absolutePath, isDirectory: relative.isdir }
    })
  }

  constructor(config: Config) {
    this.config = config

    this.changeTreeDataEventEmitter = new EventEmitter<TrackedPath | void>()
    this.onDidChangeTreeData = this.changeTreeDataEventEmitter.event
  }
}
