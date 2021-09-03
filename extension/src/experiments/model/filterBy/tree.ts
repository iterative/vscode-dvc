import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri
} from 'vscode'
import { getFilterId } from '.'
import { Experiments } from '../..'
import {
  RegisteredCommands,
  registerInstrumentedCommand
} from '../../../commands/external'
import { sendTelemetryEvent } from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import { definedAndNonEmpty, flatten } from '../../../util/array'
import { createTreeView } from '../../../vscode/tree'

type FilterItem = {
  description: string
  dvcRoot: string
  id: string
  label: string
}

export class ExperimentsFilterByTree
  implements TreeDataProvider<string | FilterItem>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments
  private viewed = false

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      createTreeView<FilterItem>('dvc.views.experimentsFilterByTree', this)
    )

    this.experiments = experiments

    this.dispose.track(
      registerInstrumentedCommand<FilterItem>(
        RegisteredCommands.EXPERIMENT_FILTER_REMOVE,
        resource => this.removeFilter(resource)
      )
    )

    this.dispose.track(
      registerInstrumentedCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE_ALL,
        resource => this.removeAllFilters(resource)
      )
    )
  }

  public getTreeItem(element: string | FilterItem): TreeItem {
    if (this.isRoot(element)) {
      const item = new TreeItem(
        Uri.file(element),
        TreeItemCollapsibleState.Collapsed
      )
      item.contextValue = 'dvcFilterRoot'
      return item
    }

    const item = new TreeItem(element.label, TreeItemCollapsibleState.None)

    item.iconPath = new ThemeIcon('filter')
    item.description = element.description
    item.contextValue = 'dvcFilter'

    return item
  }

  public getChildren(element?: string): Promise<string[] | FilterItem[]> {
    if (!element) {
      return this.getRootElements()
    }

    return Promise.resolve(
      this.experiments.getFilters(element).map(filter => ({
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
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_FILTER_BY_TREE_OPENED,
        { dvcRootCount: dvcRoots.length },
        undefined
      )
      this.viewed = true
    }

    const filters = flatten(
      dvcRoots.map(dvcRoot => this.experiments.getFilters(dvcRoot))
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

    const filters = await this.getChildren(element)
    filters.map(filter => this.removeFilter(filter as FilterItem))
  }

  private removeFilter(filter: FilterItem) {
    this.experiments.removeFilter(filter.dvcRoot, filter.id)
  }

  private isRoot(element: string | FilterItem): element is string {
    return typeof element === 'string'
  }

  private getDvcRoots() {
    return this.experiments.getDvcRoots()
  }
}
