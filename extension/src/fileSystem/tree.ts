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
import { tryThenMaybeForce } from '../cli/actions'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { sendViewOpenedTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'
import { getInput } from '../vscode/inputBox'

type PathItem = { dvcRoot: string; isDirectory: boolean; isOut: boolean }

export class TrackedExplorerTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly internalCommands: InternalCommands
  private readonly treeDataChanged: EventEmitter<string | void>

  private dvcRoots: string[] = []

  private pathItems: Record<string, PathItem> = {}

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

  public getChildren(path?: string): Promise<string[]> {
    if (path) {
      const { dvcRoot } = this.getPathItem(path)
      return this.readDirectory(dvcRoot, path)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      return this.getRootElements()
    }

    return Promise.resolve([])
  }

  public getTreeItem(path: string): TreeItem {
    const resourceUri = Uri.file(path)
    const isDirectory = this.isDirectory(path)
    const treeItem = new TreeItem(
      resourceUri,
      isDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    if (!isDirectory) {
      treeItem.command = {
        arguments: [resourceUri],
        command: RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        title: 'Open File'
      }
    }

    treeItem.contextValue = this.getContextValue(path)
    return treeItem
  }

  private getPathItem(path: string) {
    return this.pathItems[path]
  }

  private isDirectory(path: string) {
    const { isDirectory } = this.getPathItem(path)
    return isDirectory
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
        const aIsDirectory = this.isDirectory(a)
        if (aIsDirectory === this.isDirectory(b)) {
          return a.localeCompare(b)
        }
        return aIsDirectory ? -1 : 1
      })
  }

  private getDataPlaceholder(path: string): string {
    return path.trim() + '.dvc'
  }

  private hasDataPlaceholder(path: string): boolean {
    return exists(this.getDataPlaceholder(path))
  }

  private hasRemote(path: string): boolean {
    const { isOut, isDirectory } = this.getPathItem(path)
    return isOut || !isDirectory
  }

  private getContextValue(path: string): string {
    if (!exists(path)) {
      return 'dvcTrackedVirtual'
    }

    const baseContext = this.isDirectory(path)
      ? 'dvcTrackedDir'
      : 'dvcTrackedFile'

    if (this.hasDataPlaceholder(path)) {
      return baseContext + 'Data'
    }
    if (this.hasRemote(path)) {
      return baseContext + 'HasRemote'
    }

    return baseContext
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
      this.pathItems[absolutePath] = {
        dvcRoot: root,
        isDirectory: relative.isdir,
        isOut: relative.isout
      }
      return absolutePath
    })
  }

  private registerCommands(workspaceChanged: EventEmitter<void>) {
    this.internalCommands.registerExternalCliCommand(
      RegisteredCliCommands.INIT,
      async () => {
        const root = getFirstWorkspaceFolder()
        if (root) {
          await this.internalCommands.executeCommand(
            AvailableCommands.INIT,
            root
          )
          workspaceChanged.fire()
        }
      }
    )

    this.internalCommands.registerExternalCommand<string>(
      RegisteredCommands.DELETE_TARGET,
      path => deleteTarget(path)
    )

    this.internalCommands.registerExternalCliCommand<string>(
      RegisteredCliCommands.REMOVE_TARGET,
      path => {
        deleteTarget(path)
        this.treeDataChanged.fire()
        const { dvcRoot } = this.getPathItem(path)
        const relPath = this.getDataPlaceholder(relative(dvcRoot, path))
        return this.internalCommands.executeCommand(
          AvailableCommands.REMOVE,
          dvcRoot,
          relPath
        )
      }
    )

    this.internalCommands.registerExternalCliCommand<string>(
      RegisteredCliCommands.RENAME_TARGET,
      async path => {
        const { dvcRoot } = this.getPathItem(path)
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

    this.internalCommands.registerExternalCliCommand<string>(
      RegisteredCliCommands.PULL_TARGET,
      path => this.tryThenMaybeForce(AvailableCommands.PULL, path)
    )

    this.internalCommands.registerExternalCliCommand<string>(
      RegisteredCliCommands.PUSH_TARGET,
      path => this.tryThenMaybeForce(AvailableCommands.PUSH, path)
    )
  }

  private tryThenMaybeForce(commandId: CommandId, path: string) {
    const { dvcRoot } = this.getPathItem(path)
    return tryThenMaybeForce(
      this.internalCommands,
      commandId,
      dvcRoot,
      relative(dvcRoot, path)
    )
  }
}
