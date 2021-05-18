import {
  commands,
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
import { listDvcOnly } from '../../cli/reader'
import { Config } from '../../Config'
import { definedAndNonEmpty } from '../../util'
import { reportStderrOrThrow } from '../../vscode/reporting'
import { deleteTarget } from '../workspace'
import { exists } from '..'
import { init, pullTarget, pushTarget, removeTarget } from '../../cli/executor'

export class TrackedExplorerTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  private readonly treeDataChanged: EventEmitter<
    string | void
  > = this.dispose.track(new EventEmitter())

  public readonly onDidChangeTreeData: Event<string | void> = this
    .treeDataChanged.event

  private config: Config
  private dvcRoots: string[] = []

  private pathRoots: Record<string, string> = {}
  private pathIsDirectory: Record<string, boolean> = {}
  private pathIsOut: Record<string, boolean> = {}

  public refresh(path?: string): void {
    if (path) {
      this.treeDataChanged.fire(dirname(path))
    }
  }

  public reset(): void {
    this.treeDataChanged.fire()
  }

  public initialize(dvcRoots: string[]) {
    this.dvcRoots = dvcRoots
    this.reset()
  }

  public openResource(resource: Uri) {
    return window.showTextDocument(resource).then(
      textEditor => textEditor,
      error => {
        reportStderrOrThrow(error.message)
      }
    )
  }

  private async getRootElements() {
    const rootElements = await Promise.all(
      this.dvcRoots.map(dvcRoot => this.readDirectory(dvcRoot, dvcRoot))
    )
    return rootElements
      .reduce((a, b) => a.concat(b), [])
      .sort((a, b) => {
        const aIsDirectory = this.pathIsDirectory[a]
        if (aIsDirectory === this.pathIsDirectory[b]) {
          return a.localeCompare(b)
        }
        return aIsDirectory ? -1 : 1
      })
  }

  public getChildren(element?: string): Promise<string[]> {
    if (element) {
      return this.readDirectory(this.pathRoots[element], element)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      return this.getRootElements()
    }

    return Promise.resolve([])
  }

  private getDataPlaceholder(path: string): string {
    return path.trim() + '.dvc'
  }

  private hasDataPlaceholder(path: string): boolean {
    return exists(this.getDataPlaceholder(path))
  }

  private hasRemote(path: string): boolean {
    return this.pathIsOut[path] || !this.pathIsDirectory[path]
  }

  private getContextValue(path: string): string {
    if (this.hasDataPlaceholder(path)) {
      return 'dvcData'
    }
    if (this.hasRemote(path)) {
      return 'dvcHasRemote'
    }
    return 'dvc'
  }

  public getTreeItem(element: string): TreeItem {
    const resourceUri = Uri.file(element)
    const elementIsDirectory = this.pathIsDirectory[element]
    const treeItem = new TreeItem(
      resourceUri,
      elementIsDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    if (!elementIsDirectory) {
      treeItem.command = {
        command: 'dvc.views.trackedExplorerTree.openFile',
        title: 'Open File',
        arguments: [resourceUri]
      }
    }

    treeItem.contextValue = this.getContextValue(element)

    return treeItem
  }

  private async readDirectory(root: string, path: string): Promise<string[]> {
    if (!root) {
      return []
    }

    const listOutput = await listDvcOnly(
      {
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.getCliPath(),
        cwd: path
      },
      relative(root, path)
    )

    return listOutput.map(relative => {
      const absolutePath = join(path, relative.path)
      this.pathRoots[absolutePath] = root
      this.pathIsDirectory[absolutePath] = relative.isdir
      this.pathIsOut[absolutePath] = relative.isout
      return absolutePath
    })
  }

  private registerCommands(workspaceChanged: EventEmitter<void>) {
    this.dispose.track(
      commands.registerCommand('dvc.init', async () => {
        await init({
          cwd: this.config.workspaceRoot,
          cliPath: this.config.getCliPath(),
          pythonBinPath: this.config.pythonBinPath
        })

        workspaceChanged.fire()
      })
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.trackedExplorerTree.openFile',
        resource => this.openResource(resource)
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.deleteTarget', path => deleteTarget(path))
    )

    this.dispose.track(
      commands.registerCommand('dvc.removeTarget', path => {
        deleteTarget(path)
        return removeTarget({
          fsPath: this.getDataPlaceholder(path),
          cliPath: this.config.getCliPath(),
          pythonBinPath: this.config.pythonBinPath
        })
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.pullTarget', path =>
        pullTarget({
          fsPath: path,
          cliPath: this.config.getCliPath(),
          pythonBinPath: this.config.pythonBinPath
        })
      )
    )

    this.dispose.track(
      commands.registerCommand('dvc.pushTarget', path =>
        pushTarget({
          fsPath: path,
          cliPath: this.config.getCliPath(),
          pythonBinPath: this.config.pythonBinPath
        })
      )
    )
  }

  constructor(config: Config, workspaceChanged: EventEmitter<void>) {
    this.config = config

    this.registerCommands(workspaceChanged)

    this.dispose.track(
      window.registerTreeDataProvider('dvc.views.trackedExplorerTree', this)
    )
  }
}
