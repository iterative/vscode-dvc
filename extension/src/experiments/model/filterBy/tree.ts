import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState
} from 'vscode'
import { getFilterId } from '.'
import { WorkspaceExperiments } from '../../workspace'
import { RegisteredCommands } from '../../../commands/external'
import { InternalCommands } from '../../../commands/internal'
import { sendViewOpenedTelemetryEvent } from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import { definedAndNonEmpty } from '../../../util/array'
import { createTreeView, getRootItem } from '../../../vscode/tree'
import { BaseClass } from '../../../class'

type FilterItem = {
  description: string
  dvcRoot: string
  id: string
  label: string
}

export class ExperimentsFilterByTree
  extends BaseClass
  implements TreeDataProvider<string | FilterItem>
{
  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: WorkspaceExperiments
  private viewed = false

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands
  ) {
    super()

    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
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
  }

  public getTreeItem(element: string | FilterItem): TreeItem {
    if (this.isRoot(element)) {
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

      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private async removeAllFilters(element: string | undefined) {
    if (!element) {
      const dvcRoots = this.getDvcRoots()
      dvcRoots.map(dvcRoot => this.removeAllFilters(dvcRoot))
      return
    }

    this.experiments.getRepository(element).autoApplyFilters(false)
    const filters = await this.getChildren(element)
    filters.map(filter => this.removeFilter(filter as FilterItem))
  }

  private removeFilter(filter: FilterItem) {
    return this.experiments
      .getRepository(filter.dvcRoot)
      .removeFilter(filter.id)
  }

  private isRoot(element: string | FilterItem): element is string {
    return typeof element === 'string'
  }

  private getDvcRoots() {
    return this.experiments.getDvcRoots()
  }
}
