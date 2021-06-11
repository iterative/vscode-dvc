import { dirname, join, relative } from 'path'
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
import { Config } from '../../config'
import { definedAndNonEmpty } from '../../util/array'
import { deleteTarget } from '../workspace'
import { exists } from '..'
import { CliExecutor } from '../../cli/executor'
import { CliReader } from '../../cli/reader'
import { getConfigValue, setConfigValue } from '../../vscode/config'

export class TrackedExplorerTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  private readonly cliReader: CliReader
  private readonly cliExecutor: CliExecutor
  private readonly treeDataChanged: EventEmitter<string | void>
  public readonly onDidChangeTreeData: Event<string | void>

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

  private doNotShowAgainText = "Don't Show Again"

  private noOpenUnsupportedOption =
    'dvc.views.trackedExplorerTree.noOpenUnsupported'

  private handleOpenUnsupportedError = async (relPath: string) => {
    if (getConfigValue(this.noOpenUnsupportedOption)) {
      return
    }
    const response = await window.showInformationMessage(
      `Cannot open ${relPath}. File is unsupported and cannot be opened as text.`,
      this.doNotShowAgainText
    )

    if (response) {
      return setConfigValue(this.noOpenUnsupportedOption, true)
    }
  }

  private noPromptPullMissingOption =
    'dvc.views.trackedExplorerTree.noPromptPullMissing'

  private openPullPrompt = async (dvcRoot: string, relPath: string) => {
    if (getConfigValue(this.noPromptPullMissingOption)) {
      return
    }
    const response = await window.showInformationMessage(
      `${relPath} does not exist at the specified path.`,
      'Pull File',
      this.doNotShowAgainText
    )

    if (response === 'Pull File') {
      return this.cliExecutor.pullTarget(dvcRoot, relPath)
    }

    if (response === this.doNotShowAgainText) {
      return setConfigValue(this.noPromptPullMissingOption, true)
    }
  }

  public openResource = (resource: Uri) => {
    const path = resource.fsPath
    const dvcRoot = this.pathRoots[path]
    const relPath = relative(dvcRoot, path)

    if (!exists(path)) {
      return this.openPullPrompt(dvcRoot, relPath)
    }

    return window.showTextDocument(resource).then(
      textEditor => textEditor,
      error => {
        if (
          error.message.includes(
            'File seems to be binary and cannot be opened as text'
          )
        ) {
          return this.handleOpenUnsupportedError(relPath)
        }
        return window.showInformationMessage(error.message)
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
        arguments: [resourceUri],
        command: 'dvc.views.trackedExplorerTree.openFile',
        title: 'Open File'
      }
    }

    treeItem.contextValue = this.getContextValue(element)

    return treeItem
  }

  private async readDirectory(root: string, path: string): Promise<string[]> {
    if (!root) {
      return []
    }

    const listOutput = await this.cliReader.listDvcOnly(
      root,
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

  private registerPathCommand = (
    name: string,
    func: (cwd: string, relPath: string) => Promise<string>
  ) =>
    commands.registerCommand(name, path => {
      const dvcRoot = this.pathRoots[path]
      const relPath = relative(dvcRoot, path)
      return func(dvcRoot, relPath)
    })

  private registerCommands(workspaceChanged: EventEmitter<void>) {
    this.dispose.track(
      commands.registerCommand('dvc.init', async () => {
        const root = this.config.getFirstWorkspaceFolderRoot()
        if (root) {
          await this.cliExecutor.init(root)
        }
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
        this.treeDataChanged.fire()
        const dvcRoot = this.pathRoots[path]
        const relPath = this.getDataPlaceholder(relative(dvcRoot, path))
        return this.cliExecutor.removeTarget(dvcRoot, relPath)
      })
    )

    this.dispose.track(
      this.registerPathCommand('dvc.pullTarget', this.cliExecutor.pullTarget)
    )

    this.dispose.track(
      this.registerPathCommand('dvc.pushTarget', this.cliExecutor.pushTarget)
    )
  }

  constructor(
    config: Config,
    cliReader: CliReader,
    cliExecutor: CliExecutor,
    workspaceChanged: EventEmitter<void>,
    treeDataChanged?: EventEmitter<string | void>
  ) {
    this.config = config
    this.cliReader = cliReader
    this.cliExecutor = cliExecutor

    this.registerCommands(workspaceChanged)

    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.dispose.track(
      window.registerTreeDataProvider('dvc.views.trackedExplorerTree', this)
    )
  }
}
