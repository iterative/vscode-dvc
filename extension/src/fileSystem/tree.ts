import { relative } from 'path'
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
import { exists, relativeWithUri } from '.'
import { fireWatcher } from './watcher'
import { deleteTarget, moveTargets } from './workspace'
import { definedAndNonEmpty, flatten } from '../util/array'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../commands/internal'
import { tryThenMaybeForce } from '../cli/actions'
import { Flag } from '../cli/args'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { sendViewOpenedTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'
import { getInput } from '../vscode/inputBox'
import { pickResources } from '../vscode/resourcePicker'
import { warnOfConsequences } from '../vscode/modal'
import { Response } from '../vscode/response'
import { Resource } from '../repository/commands'
import { WorkspaceRepositories } from '../repository/workspace'
import { PathItem } from '../repository/model/collect'

export class TrackedExplorerTree implements TreeDataProvider<PathItem> {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<void>

  private readonly internalCommands: InternalCommands
  private readonly repositories: WorkspaceRepositories

  private dvcRoots: string[] = []

  private viewed = false

  constructor(
    internalCommands: InternalCommands,
    workspaceChanged: EventEmitter<void>,
    repositories: WorkspaceRepositories
  ) {
    this.internalCommands = internalCommands

    this.registerCommands(workspaceChanged)

    this.repositories = repositories

    this.onDidChangeTreeData = repositories.treeDataChanged.event

    this.dispose.track(
      window.registerTreeDataProvider('dvc.views.trackedExplorerTree', this)
    )
  }

  public initialize(dvcRoots: string[]) {
    this.dvcRoots = dvcRoots
    this.reset()
  }

  public async getChildren(pathItem?: PathItem): Promise<PathItem[]> {
    if (pathItem) {
      const contents = await this.getPathItemChildren(pathItem)
      return this.sortDirectory(contents)
    }

    if (definedAndNonEmpty(this.dvcRoots)) {
      return this.getRootElements()
    }

    return []
  }

  public getTreeItem({ isDirectory, resourceUri }: PathItem): TreeItem {
    const treeItem = new TreeItem(
      resourceUri,
      isDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    treeItem.contextValue = this.getContextValue(resourceUri, isDirectory)

    if (!isDirectory && treeItem.contextValue !== 'virtual') {
      treeItem.command = {
        arguments: [resourceUri],
        command: RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        title: 'Open File'
      }
    }

    return treeItem
  }

  private reset(): void {
    this.repositories.treeDataChanged.fire()
  }

  private async getRootElements() {
    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_TRACKED_EXPLORER_TREE_OPENED,
        this.dvcRoots.length
      )
      this.viewed = true
    }

    if (this.dvcRoots.length === 1) {
      const [onlyRoot] = this.dvcRoots
      return this.getRepoChildren(onlyRoot)
    }

    return flatten(
      await Promise.all(
        this.dvcRoots.map(dvcRoot => this.getRepoChildren(dvcRoot))
      )
    )
  }

  private getDataPlaceholder({ fsPath }: { fsPath: string }): string {
    return fsPath.trim() + '.dvc'
  }

  private getContextValue({ fsPath }: Uri, isDirectory: boolean): string {
    if (!exists(fsPath)) {
      return 'virtual'
    }

    const baseContext = isDirectory ? 'dir' : 'file'

    if (exists(this.getDataPlaceholder({ fsPath }))) {
      return baseContext + 'Data'
    }

    return baseContext
  }

  private getPathItemChildren(pathItem: PathItem): Promise<PathItem[]> {
    const { dvcRoot, resourceUri } = pathItem
    if (!dvcRoot) {
      return Promise.resolve([])
    }

    return this.getRepoChildren(dvcRoot, resourceUri.fsPath)
  }

  private async getRepoChildren(dvcRoot: string, path?: string) {
    await this.repositories.isReady()
    return this.sortDirectory(
      this.repositories.getRepository(dvcRoot).getChildren(path || dvcRoot)
    )
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
          const response = await warnOfConsequences(
            'Are you sure you want to move the selected data into this dataset?',
            Response.MOVE
          )
          if (response !== Response.MOVE) {
            return
          }

          await moveTargets(targets, destination)
          return fireWatcher(this.getDataPlaceholder(destination))
        }
      }
    )

    this.internalCommands.registerExternalCliCommand<Resource>(
      RegisteredCliCommands.REMOVE_TARGET,
      async ({ dvcRoot, resourceUri }) => {
        const relPath = relative(dvcRoot, this.getDataPlaceholder(resourceUri))
        await this.internalCommands.executeCommand(
          AvailableCommands.REMOVE,
          dvcRoot,
          relPath
        )
        return deleteTarget(resourceUri)
      }
    )

    this.internalCommands.registerExternalCliCommand<Resource>(
      RegisteredCliCommands.RENAME_TARGET,
      async ({ dvcRoot, resourceUri }) => {
        const relPath = relativeWithUri(dvcRoot, resourceUri)
        const relDestination = await getInput(
          'Enter a destination relative to the root',
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

    this.internalCommands.registerExternalCliCommand<PathItem>(
      RegisteredCliCommands.PULL_TARGET,
      this.tryThenForce(AvailableCommands.PULL)
    )

    this.internalCommands.registerExternalCliCommand<PathItem>(
      RegisteredCliCommands.PUSH_TARGET,
      this.tryThenForce(AvailableCommands.PUSH)
    )
  }

  private tryThenForce(commandId: CommandId) {
    return ({ dvcRoot, resourceUri, isTracked }: PathItem) => {
      const relPath = relativeWithUri(dvcRoot, resourceUri)
      const args = [dvcRoot, relPath]
      if (!isTracked) {
        args.push(Flag.RECURSIVE)
      }
      return tryThenMaybeForce(this.internalCommands, commandId, ...args)
    }
  }
}
