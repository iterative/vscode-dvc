import { dirname, relative } from 'path'
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
import { exists, isDirectory } from '.'
import { fireWatcher } from './watcher'
import { deleteTarget, moveTargets } from './workspace'
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
import { pickResources } from '../vscode/resourcePicker'
import { getWarningResponse } from '../vscode/modal'
import { Response } from '../vscode/response'
import { Resource } from '../repository/commands'

export type PathItem = Resource & {
  isDirectory: boolean
  isOut: boolean
}

export class TrackedExplorerTree implements TreeDataProvider<PathItem> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<PathItem | void>

  private readonly internalCommands: InternalCommands
  private readonly treeDataChanged: EventEmitter<PathItem | void>

  private dvcRoots: string[] = []

  private pathItems: Record<string, PathItem> = {}

  private viewed = false

  constructor(
    internalCommands: InternalCommands,
    workspaceChanged: EventEmitter<void>,
    treeDataChanged?: EventEmitter<PathItem | void>
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
      const pathItem = this.getPathItem(dirname(path))
      this.treeDataChanged.fire(pathItem)
    }
  }

  public reset(): void {
    this.treeDataChanged.fire()
  }

  public initialize(dvcRoots: string[]) {
    this.dvcRoots = dvcRoots
    dvcRoots.forEach(
      dvcRoot =>
        (this.pathItems[dvcRoot] = {
          dvcRoot,
          isDirectory: true,
          isOut: false,
          resourceUri: Uri.file(dvcRoot)
        })
    )
    this.reset()
  }

  public async getChildren(pathItem?: PathItem): Promise<PathItem[]> {
    if (pathItem) {
      const contents = await this.readDirectory(pathItem)
      return this.sortDirectory(contents)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      return this.getRootElements()
    }

    return []
  }

  public getTreeItem({ isDirectory, isOut, resourceUri }: PathItem): TreeItem {
    const treeItem = new TreeItem(
      resourceUri,
      isDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    treeItem.contextValue = this.getContextValue(
      resourceUri.fsPath,
      isDirectory,
      isOut
    )

    if (!isDirectory && treeItem.contextValue !== 'virtual') {
      treeItem.command = {
        arguments: [resourceUri],
        command: RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        title: 'Open File'
      }
    }

    return treeItem
  }

  private getPathItem(path: string) {
    return this.pathItems[path]
  }

  private getRootElements() {
    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_TRACKED_EXPLORER_TREE_OPENED,
        this.dvcRoots.length
      )
      this.viewed = true
    }

    if (this.dvcRoots.length === 1) {
      const [onlyRoot] = this.dvcRoots
      return this.getChildren(this.getPathItem(onlyRoot))
    }

    return this.dvcRoots.map(dvcRoot => this.getPathItem(dvcRoot))
  }

  private getDataPlaceholder(path: string): string {
    return path.trim() + '.dvc'
  }

  private hasDataPlaceholder(path: string): boolean {
    return exists(this.getDataPlaceholder(path))
  }

  private getContextValue(
    path: string,
    isDirectory: boolean,
    isOut: boolean
  ): string {
    if (!exists(path)) {
      return 'virtual'
    }

    const baseContext = isDirectory ? 'dir' : 'file'

    if (this.hasDataPlaceholder(path)) {
      return baseContext + 'Data'
    }
    if (isOut || !isDirectory) {
      return baseContext + 'HasRemote'
    }

    return baseContext
  }

  private async readDirectory(pathItem: PathItem): Promise<PathItem[]> {
    const { dvcRoot, resourceUri } = pathItem
    if (!dvcRoot) {
      return []
    }

    const listOutput = await this.internalCommands.executeCommand<ListOutput[]>(
      AvailableCommands.LIST_DVC_ONLY,
      dvcRoot,
      relative(dvcRoot, resourceUri.fsPath)
    )

    return listOutput.map(relative => {
      const uri = Uri.joinPath(resourceUri, relative.path)
      const absolutePath = uri.fsPath
      const pathItem = {
        dvcRoot,
        // TODO: revert after https://github.com/iterative/dvc/issues/6094 is fixed
        isDirectory: exists(absolutePath)
          ? isDirectory(absolutePath)
          : relative.isdir,
        isOut: relative.isout,
        resourceUri: uri
      }
      this.pathItems[absolutePath] = pathItem
      return pathItem
    })
  }

  private sortDirectory(contents: PathItem[]) {
    return contents.sort((a, b) => {
      const aIsDirectory = a.isDirectory
      if (aIsDirectory === b.isDirectory) {
        return a.resourceUri.fsPath.localeCompare(b.resourceUri.fsPath)
      }
      return aIsDirectory ? -1 : 1
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

    this.internalCommands.registerExternalCommand<Resource>(
      RegisteredCommands.DELETE_TARGET,
      ({ resourceUri }) => deleteTarget(resourceUri)
    )

    this.internalCommands.registerExternalCommand<Resource>(
      RegisteredCommands.MOVE_TARGETS,
      async ({ resourceUri: destination }) => {
        const targets = await pickResources(
          'pick resources to add to the dataset'
        )
        if (targets) {
          const response = await getWarningResponse(
            'Are you sure you want to move the selected data into this dataset?',
            Response.MOVE
          )
          if (response !== Response.MOVE) {
            return
          }

          await moveTargets(targets, destination)
          return fireWatcher(this.getDataPlaceholder(destination.fsPath))
        }
      }
    )

    this.internalCommands.registerExternalCliCommand<Resource>(
      RegisteredCliCommands.REMOVE_TARGET,
      ({ dvcRoot, resourceUri }) => {
        deleteTarget(resourceUri)
        this.treeDataChanged.fire()
        const relPath = this.getDataPlaceholder(
          relative(dvcRoot, resourceUri.fsPath)
        )
        return this.internalCommands.executeCommand(
          AvailableCommands.REMOVE,
          dvcRoot,
          relPath
        )
      }
    )

    this.internalCommands.registerExternalCliCommand<Resource>(
      RegisteredCliCommands.RENAME_TARGET,
      async ({ dvcRoot, resourceUri }) => {
        const relPath = relative(dvcRoot, resourceUri.fsPath)
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

    this.internalCommands.registerExternalCliCommand<Resource>(
      RegisteredCliCommands.PULL_TARGET,
      resource => this.tryThenMaybeForce(AvailableCommands.PULL, resource)
    )

    this.internalCommands.registerExternalCliCommand<Resource>(
      RegisteredCliCommands.PUSH_TARGET,
      resource => this.tryThenMaybeForce(AvailableCommands.PUSH, resource)
    )
  }

  private tryThenMaybeForce(
    commandId: CommandId,
    { dvcRoot, resourceUri }: Resource
  ) {
    return tryThenMaybeForce(
      this.internalCommands,
      commandId,
      dvcRoot,
      relative(dvcRoot, resourceUri.path)
    )
  }
}
