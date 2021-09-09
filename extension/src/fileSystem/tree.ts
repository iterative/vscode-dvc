import { dirname, join, relative } from 'path'
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
import { exists } from '.'
import { deleteTarget } from './workspace'
import { definedAndNonEmpty } from '../util/array'
import { ListOutput } from '../cli/reader'
import { getConfigValue, setConfigValue } from '../vscode/config'
import { tryThenMaybeForce } from '../cli/actions'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import {
  RegisteredCommands,
  registerInstrumentedCommand
} from '../commands/external'
import { sendViewOpenedTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'
import { getInput } from '../vscode/inputBox'

export class TrackedExplorerTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly internalCommands: InternalCommands
  private readonly treeDataChanged: EventEmitter<string | void>

  private dvcRoots: string[] = []

  private pathRoots: Record<string, string> = {}
  private pathIsDirectory: Record<string, boolean> = {}
  private pathIsOut: Record<string, boolean> = {}

  private doNotShowAgainText = "Don't Show Again"

  private noOpenUnsupportedOption =
    'dvc.views.trackedExplorerTree.noOpenUnsupported'

  private noPromptPullMissingOption =
    'dvc.views.trackedExplorerTree.noPromptPullMissing'

  private viewed = false

  constructor(
    internalCommands: InternalCommands,
    workspaceChanged: EventEmitter<void>,
    treeDataChanged?: EventEmitter<string | void>
  ) {
    this.internalCommands = internalCommands

    this.registerCommands(workspaceChanged)

    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.dispose.track(
      window.registerTreeDataProvider('dvc.views.trackedExplorerTree', this)
    )
  }

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

  public getChildren(element?: string): Promise<string[]> {
    if (element) {
      return this.readDirectory(this.pathRoots[element], element)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      return this.getRootElements()
    }

    return Promise.resolve([])
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
        command: RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        title: 'Open File'
      }
    }

    treeItem.contextValue = this.getContextValue(element)
    return treeItem
  }

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

  private openPullPrompt = async (path: string) => {
    if (getConfigValue(this.noPromptPullMissingOption)) {
      return
    }
    const response = await window.showInformationMessage(
      `${path} does not exist at the specified path.`,
      'Pull File',
      this.doNotShowAgainText
    )

    if (response === 'Pull File') {
      return this.tryThenMaybeForce(AvailableCommands.PULL, path)
    }

    if (response === this.doNotShowAgainText) {
      return setConfigValue(this.noPromptPullMissingOption, true)
    }
  }

  private async getRootElements() {
    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_TRACKED_EXPLORER_TREE_OPENED,
        this.dvcRoots.length
      )
      this.viewed = true
    }

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

  private openResource = (resource: Uri) => {
    const path = resource.fsPath
    const dvcRoot = this.pathRoots[path]
    const relPath = relative(dvcRoot, path)

    if (!exists(path)) {
      return this.openPullPrompt(path)
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
      return 'dvcTrackedData'
    }
    if (this.hasRemote(path)) {
      return 'dvcTrackedHasRemote'
    }
    return 'dvcTracked'
  }

  private async readDirectory(root: string, path: string): Promise<string[]> {
    if (!root) {
      return []
    }

    const listOutput = await this.internalCommands.executeCommand<ListOutput[]>(
      AvailableCommands.LIST_DVC_ONLY,
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

  private registerCommands(workspaceChanged: EventEmitter<void>) {
    this.dispose.track(
      registerInstrumentedCommand(RegisteredCommands.INIT, async () => {
        const root = getFirstWorkspaceFolder()
        if (root) {
          await this.internalCommands.executeCommand(
            AvailableCommands.INIT,
            root
          )
          workspaceChanged.fire()
        }
      })
    )

    this.dispose.track(
      registerInstrumentedCommand<Uri>(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        resource => this.openResource(resource)
      )
    )

    this.dispose.track(
      registerInstrumentedCommand<string>(
        RegisteredCommands.DELETE_TARGET,
        path => deleteTarget(path)
      )
    )

    this.dispose.track(
      registerInstrumentedCommand<string>(
        RegisteredCommands.REMOVE_TARGET,
        path => {
          deleteTarget(path)
          this.treeDataChanged.fire()
          const dvcRoot = this.pathRoots[path]
          const relPath = this.getDataPlaceholder(relative(dvcRoot, path))
          return this.internalCommands.executeCommand(
            AvailableCommands.REMOVE,
            dvcRoot,
            relPath
          )
        }
      )
    )

    this.dispose.track(
      registerInstrumentedCommand<string>(
        RegisteredCommands.RENAME_TARGET,
        async path => {
          const dvcRoot = this.pathRoots[path]
          const relPath = relative(dvcRoot, path)
          const relDestination = await getInput(
            'enter a destination relative to the root',
            relPath
          )
          if (!relDestination || relDestination === relPath) {
            return
          }

          return this.internalCommands.executeCommand(
            AvailableCommands.MOVE,
            dvcRoot,
            relPath,
            relDestination
          )
        }
      )
    )

    this.dispose.track(
      registerInstrumentedCommand<string>(
        RegisteredCommands.PULL_TARGET,
        path => this.tryThenMaybeForce(AvailableCommands.PULL, path)
      )
    )

    this.dispose.track(
      registerInstrumentedCommand<string>(
        RegisteredCommands.PUSH_TARGET,
        path => this.tryThenMaybeForce(AvailableCommands.PUSH, path)
      )
    )
  }

  private tryThenMaybeForce(commandId: CommandId, path: string) {
    const dvcRoot = this.pathRoots[path]
    return tryThenMaybeForce(
      this.internalCommands,
      commandId,
      dvcRoot,
      relative(dvcRoot, path)
    )
  }
}
