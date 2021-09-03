import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri
} from 'vscode'
import { SortDefinition } from './'
import { Experiments } from '../..'
import { createTreeView } from '../../../vscode/tree'
import {
  RegisteredCommands,
  registerInstrumentedCommand
} from '../../../commands/external'
import { sendTelemetryEvent } from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'

export type SortItem = {
  dvcRoot: string
  sort: SortDefinition
}

export class ExperimentsSortByTree
  implements TreeDataProvider<string | SortItem>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<void>

  private readonly experiments: Experiments
  private viewed = false

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      createTreeView<string | SortItem>('dvc.views.experimentsSortByTree', this)
    )

    this.dispose.track(
      registerInstrumentedCommand<SortItem>(
        RegisteredCommands.EXPERIMENT_SORT_REMOVE,
        ({ dvcRoot, sort: { path } }: SortItem) =>
          this.experiments.removeSort(dvcRoot, path)
      )
    )

    this.dispose.track(
      registerInstrumentedCommand(
        RegisteredCommands.EXPERIMENT_SORTS_REMOVE_ALL,
        resource => {
          this.removeAllSorts(resource)
        }
      )
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string | SortItem): TreeItem {
    if (typeof element === 'string') {
      return this.getTreeItemFromDvcRoot(element)
    }
    return this.getTreeItemFromSortDefinition(element)
  }

  public getChildren(
    dvcRoot: undefined | string
  ): string[] | SortItem[] | Promise<string[] | SortItem[]> {
    if (dvcRoot === undefined) {
      return this.getRootItems()
    }

    return this.experiments.getSorts(dvcRoot).map(sort => ({ dvcRoot, sort }))
  }

  private async getRootItems() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()

    if (!this.viewed) {
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_SORT_BY_TREE_OPENED,
        { dvcRootCount: dvcRoots.length },
        undefined
      )
      this.viewed = true
    }

    if (dvcRoots.length === 0) {
      return []
    }
    if (dvcRoots.length === 1) {
      return this.getChildren(dvcRoots[0])
    }
    if (
      dvcRoots.find(dvcRoot => this.experiments.getSorts(dvcRoot).length > 0)
    ) {
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    } else {
      return []
    }
  }

  private getTreeItemFromDvcRoot(rootPath: string) {
    const projectTreeItem = new TreeItem(
      Uri.file(rootPath),
      TreeItemCollapsibleState.Expanded
    )

    projectTreeItem.id = rootPath
    projectTreeItem.contextValue = 'dvcSortRoot'

    return projectTreeItem
  }

  private getTreeItemFromSortDefinition(sortWithParent: SortItem) {
    const { sort } = sortWithParent
    const sortDefinitionTreeItem = new TreeItem(sort.path)

    sortDefinitionTreeItem.iconPath = new ThemeIcon(
      sort.descending ? 'arrow-down' : 'arrow-up'
    )
    sortDefinitionTreeItem.contextValue = 'dvcSort'

    return sortDefinitionTreeItem
  }

  private async removeAllSorts(element: string | undefined) {
    if (!element) {
      const dvcRoots = this.experiments.getDvcRoots()
      dvcRoots.map(dvcRoot => this.removeAllSorts(dvcRoot))
      return
    }

    const sorts = (await this.getChildren(element)) as SortItem[]
    sorts.map(({ dvcRoot, sort }) =>
      this.experiments.removeSort(dvcRoot, sort.path)
    )
  }
}
