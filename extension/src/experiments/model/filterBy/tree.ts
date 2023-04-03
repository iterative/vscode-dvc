import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView
} from 'vscode'
import { getFilterId } from '.'
import { WorkspaceExperiments } from '../../workspace'
import { RegisteredCommands } from '../../../commands/external'
import { InternalCommands } from '../../../commands/internal'
import { sendViewOpenedTelemetryEvent } from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import {
  definedAndNonEmpty,
  joinTruthyItems,
  sortCollectedArray
} from '../../../util/array'
import { createTreeView, getRootItem, isRoot } from '../../../tree'
import { Disposable } from '../../../class/dispose'
import { sum } from '../../../util/math'

export type FilterItem = {
  description: string
  dvcRoot: string
  id: string
  label: string
}

export class ExperimentsFilterByTree
  extends Disposable
  implements TreeDataProvider<string | FilterItem>
{
  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: WorkspaceExperiments
  private readonly view: TreeView<string | FilterItem>
  private viewed = false

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands
  ) {
    super()

    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.view = this.dispose.track(
      createTreeView<FilterItem>('dvc.views.experimentsFilterByTree', this)
    )

    this.experiments = experiments

    internalCommands.registerExternalCommand<FilterItem>(
      RegisteredCommands.EXPERIMENT_FILTER_REMOVE,
      resource => this.removeFilter(resource)
    )

    internalCommands.registerExternalCommand(
      RegisteredCommands.EXPERIMENT_FILTERS_REMOVE_ALL,
      resource => this.removeAllFilters(resource)
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | FilterItem): TreeItem {
    if (isRoot(element)) {
      return getRootItem(element)
    }

    const item = new TreeItem(element.label, TreeItemCollapsibleState.None)

    item.iconPath = new ThemeIcon('filter')
    item.description = element.description

    return item
  }

  public getChildren(element?: string): Promise<string[] | FilterItem[]> {
    if (!element) {
      return this.getRootElements()
    }

    return Promise.resolve(
      this.experiments
        .getRepository(element)
        .getFilters()
        .map(filter => ({
          description: [filter.operator, filter.value].join(' '),
          dvcRoot: element,
          id: getFilterId(filter),
          label: filter.path
        }))
    )
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.getDvcRoots()

    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_FILTER_BY_TREE_OPENED,
        dvcRoots.length
      )
      this.viewed = true
    }

    const filters = dvcRoots.flatMap(dvcRoot =>
      this.experiments.getRepository(dvcRoot).getFilters()
    )
    if (definedAndNonEmpty(filters)) {
      if (dvcRoots.length === 1) {
        const [onlyRepo] = dvcRoots
        return this.getChildren(onlyRepo)
      }

      return sortCollectedArray(dvcRoots, (a, b) => a.localeCompare(b))
    }

    return []
  }

  private async removeAllFilters(element: string | undefined) {
    if (!element) {
      const dvcRoots = this.getDvcRoots()
      for (const dvcRoot of dvcRoots) {
        void this.removeAllFilters(dvcRoot)
      }
      return
    }

    const filters = await this.getChildren(element)
    for (const filter of filters) {
      this.removeFilter(filter as FilterItem)
    }
  }

  private removeFilter(filter: FilterItem) {
    return this.experiments
      .getRepository(filter.dvcRoot)
      .removeFilter(filter.id)
  }

  private getDvcRoots() {
    return this.experiments.getDvcRoots()
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        this.view.description = this.getDescription()
      })
    )
  }

  private getDescription() {
    const dvcRoots = this.getDvcRoots()
    if (
      dvcRoots.flatMap(dvcRoot =>
        this.experiments.getRepository(dvcRoot).getFilters()
      ).length === 0
    ) {
      return
    }

    const filteredCount = sum(
      dvcRoots.flatMap(dvcRoot =>
        this.experiments.getRepository(dvcRoot).getFilteredCount()
      )
    )

    return joinTruthyItems([
      `${filteredCount || 'No'}`,
      'Experiment' + (filteredCount === 1 ? '' : 's'),
      'Filtered'
    ])
  }
}
