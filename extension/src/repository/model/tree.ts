import { relative } from 'path'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { collectSelected, collectTrackedPaths, PathItem } from './collect'
import { Resource } from '../commands'
import { WorkspaceRepositories } from '../workspace'
import { exists } from '../../fileSystem'
import { standardizePath } from '../../fileSystem/path'
import { fireWatcher } from '../../fileSystem/watcher'
import { deleteTarget, moveTargets } from '../../fileSystem/workspace'
import {
  definedAndNonEmpty,
  sameContents,
  uniqueValues
} from '../../util/array'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../commands/internal'
import { tryThenMaybeForce } from '../../cli/dvc/actions'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { pickResources } from '../../vscode/resourcePicker'
import { Modal } from '../../vscode/modal'
import { Response } from '../../vscode/response'
import { Title } from '../../vscode/title'
import { Disposable } from '../../class/dispose'
import {
  createTreeView,
  DecoratableTreeItemScheme,
  getCliErrorLabel,
  getCliErrorMessageTreeItem,
  isErrorItem
} from '../../tree'
import { getWorkspaceFolders } from '../../vscode/workspaceFolders'
import { DOT_DVC } from '../../cli/dvc/constants'

export class RepositoriesTree
  extends Disposable
  implements TreeDataProvider<PathItem>
{
  public readonly onDidChangeTreeData: Event<void>

  private readonly view: TreeView<string | PathItem>
  private readonly internalCommands: InternalCommands
  private readonly repositories: WorkspaceRepositories

  private dvcRoots: string[] = []

  private viewed = false

  constructor(
    internalCommands: InternalCommands,
    repositories: WorkspaceRepositories
  ) {
    super()

    this.internalCommands = internalCommands

    this.registerCommands()

    this.repositories = repositories

    this.onDidChangeTreeData = repositories.treeDataChanged.event

    this.view = this.dispose.track(
      createTreeView<PathItem>('dvc.views.trackedExplorerTree', this, true)
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

  public getTreeItem(item: PathItem): TreeItem {
    if (isErrorItem(item)) {
      const { error } = item

      return getCliErrorMessageTreeItem(
        getCliErrorLabel(error),
        error,
        DecoratableTreeItemScheme.TRACKED
      )
    }
    const { resourceUri, isDirectory } = item

    const treeItem = new TreeItem(
      resourceUri,
      isDirectory
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )
    treeItem.contextValue = this.getContextValue(resourceUri, isDirectory)
    treeItem.iconPath = isDirectory ? ThemeIcon.Folder : ThemeIcon.File

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

  private getRootElements() {
    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_TRACKED_EXPLORER_TREE_OPENED,
        this.dvcRoots.length
      )
      this.viewed = true
    }

    if (
      this.dvcRoots.length === 1 &&
      sameContents(
        getWorkspaceFolders(),
        this.dvcRoots.map(dvcRoot => standardizePath(dvcRoot))
      )
    ) {
      const [onlyRoot] = this.dvcRoots
      return this.getRepoChildren(onlyRoot)
    }

    return this.dvcRoots.map(dvcRoot => ({
      dvcRoot,
      isDirectory: true,
      isTracked: true,
      resourceUri: Uri.file(dvcRoot)
    }))
  }

  private getDataPlaceholder({ fsPath }: { fsPath: string }): string {
    return fsPath.trim() + DOT_DVC
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
    return [...contents].sort((a, b) => {
      const aIsDirectory = a.isDirectory
      if (aIsDirectory === b.isDirectory) {
        return a.resourceUri.fsPath.localeCompare(b.resourceUri.fsPath)
      }
      return aIsDirectory ? -1 : 1
    })
  }

  private registerCommands() {
    this.internalCommands.registerExternalCommand<Resource>(
      RegisteredCommands.DELETE_TARGET,
      ({ resourceUri }) => deleteTarget(resourceUri)
    )

    this.internalCommands.registerExternalCommand<Resource>(
      RegisteredCommands.MOVE_TARGETS,
      async ({ resourceUri: destination }) => {
        const targets = await pickResources(Title.CHOOSE_RESOURCES)
        if (targets) {
          const response = await Modal.warnOfConsequences(
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
      ({ dvcRoot, resourceUri }) => {
        const relPath = relative(dvcRoot, this.getDataPlaceholder(resourceUri))
        return this.internalCommands.executeCommand(
          AvailableCommands.REMOVE,
          dvcRoot,
          relPath
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
    return async (pathItem: PathItem) => {
      const selected = collectSelected(pathItem, this.getSelectedPathItems())

      for (const [dvcRoot, pathItems] of Object.entries(selected)) {
        const tracked = []
        for (const pathItem of pathItems) {
          tracked.push(
            ...(await collectTrackedPaths(pathItem, (path: string) =>
              this.getRepoChildren(dvcRoot, path)
            ))
          )
        }

        const uniqueTracked = uniqueValues(tracked)
        uniqueTracked.sort()

        const args = [dvcRoot, ...uniqueTracked]

        await tryThenMaybeForce(this.internalCommands, commandId, ...args)
      }
    }
  }

  private getSelectedPathItems() {
    return [...this.view.selection]
  }
}
