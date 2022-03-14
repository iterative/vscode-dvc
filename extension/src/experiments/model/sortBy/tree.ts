import { Disposable } from '@hediet/std/disposable'
import { Event, ThemeIcon, TreeDataProvider, TreeItem } from 'vscode'
import { SortDefinition } from './'
import { WorkspaceExperiments } from '../../workspace'
import { createTreeView, getRootItem } from '../../../vscode/tree'
import { RegisteredCommands } from '../../../commands/external'
import { sendViewOpenedTelemetryEvent } from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import { InternalCommands } from '../../../commands/internal'

export type SortItem = {
  dvcRoot: string
  sort: SortDefinition
}

export class ExperimentsSortByTree
  implements TreeDataProvider<string | SortItem>
{
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<void>

  private readonly experiments: WorkspaceExperiments
  private viewed = false

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands
  ) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      createTreeView<string | SortItem>('dvc.views.experimentsSortByTree', this)
    )

    internalCommands.registerExternalCommand<SortItem>(
      RegisteredCommands.EXPERIMENT_SORT_REMOVE,
      ({ dvcRoot, sort: { path } }: SortItem) =>
        this.experiments.getRepository(dvcRoot).removeSort(path)
    )

    internalCommands.registerExternalCommand(
      RegisteredCommands.EXPERIMENT_SORTS_REMOVE_ALL,
      resource => {
        this.removeAllSorts(resource)
      }
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string | SortItem): TreeItem {
    if (typeof element === 'string') {
      return getRootItem(element)
    }
    return this.getTreeItemFromSortDefinition(element)
  }

  public getChildren(
    dvcRoot: undefined | string
  ): string[] | SortItem[] | Promise<string[] | SortItem[]> {
    if (dvcRoot === undefined) {
      return this.getRootItems()
    }

    return this.experiments
      .getRepository(dvcRoot)
      .getSorts()
      .map(sort => ({ dvcRoot, sort }))
  }

  private async getRootItems() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()

    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_SORT_BY_TREE_OPENED,
        dvcRoots.length
      )
      this.viewed = true
    }

    if (dvcRoots.length === 0) {
      return []
    }
    if (dvcRoots.length === 1) {
      return this.getChildren(dvcRoots[0])
    }
    return dvcRoots.some(
      dvcRoot => this.experiments.getRepository(dvcRoot).getSorts().length > 0
    )
      ? dvcRoots.sort((a, b) => a.localeCompare(b))
      : []
  }

  private getTreeItemFromSortDefinition(sortWithParent: SortItem) {
    const { sort } = sortWithParent
    const sortDefinitionTreeItem = new TreeItem(sort.path)

    sortDefinitionTreeItem.iconPath = new ThemeIcon(
      sort.descending ? 'arrow-down' : 'arrow-up'
    )

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
      this.experiments.getRepository(dvcRoot).removeSort(sort.path)
    )
  }
}
