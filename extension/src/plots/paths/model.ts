import { Memento } from 'vscode'
import {
  collectPaths,
  collectTemplateOrder,
  PathType,
  PlotPath,
  TemplateOrder
} from './collect'
import { PlotsOutput } from '../../cli/dvc/reader'
import { PathSelectionModel } from '../../path/selection/model'
import { PersistenceKey } from '../../persistence/constants'
import { performSimpleOrderedUpdate } from '../../util/array'
import { MultiSourceEncoding } from '../multiSource/collect'

export class PathsModel extends PathSelectionModel<PlotPath> {
  private templateOrder: TemplateOrder
  private comparisonPathsOrder: string[]

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState, PersistenceKey.PLOT_PATH_STATUS)

    this.templateOrder = this.revive(PersistenceKey.PLOT_TEMPLATE_ORDER, [])
    this.comparisonPathsOrder = this.revive(
      PersistenceKey.PLOT_COMPARISON_PATHS_ORDER,
      []
    )
  }

  public transformAndSet(data: PlotsOutput) {
    const paths = collectPaths(data)

    this.setNewStatuses(paths)

    this.data = paths

    this.setTemplateOrder()

    this.deferred.resolve()
  }

  public setTemplateOrder(templateOrder?: TemplateOrder) {
    const filter = (type: PathType, plotPath: PlotPath) =>
      !!plotPath.type?.has(type)

    this.templateOrder = collectTemplateOrder(
      this.getPathsByType(PathType.TEMPLATE_SINGLE, filter),
      this.getPathsByType(PathType.TEMPLATE_MULTI, filter),
      templateOrder || this.templateOrder
    )

    this.persist(PersistenceKey.PLOT_TEMPLATE_ORDER, this.templateOrder)
  }

  public getChildren(
    path: string | undefined,
    multiSourceEncoding: MultiSourceEncoding = {}
  ) {
    return this.filterChildren(path).map(element => {
      const hasChildren =
        element.hasChildren === false
          ? !!multiSourceEncoding[element.path]
          : element.hasChildren

      return {
        ...element,
        descendantStatuses: this.getTerminalNodeStatuses(element.path),
        hasChildren,
        label: element.label,
        status: this.status[element.path]
      }
    })
  }

  public getTemplateOrder(): TemplateOrder {
    return collectTemplateOrder(
      this.getPathsByType(PathType.TEMPLATE_SINGLE),
      this.getPathsByType(PathType.TEMPLATE_MULTI),
      this.templateOrder
    )
  }

  public getComparisonPaths() {
    return performSimpleOrderedUpdate(
      this.comparisonPathsOrder,
      this.getPathsByType(PathType.COMPARISON)
    )
  }

  public setComparisonPathsOrder(order: string[]) {
    this.comparisonPathsOrder = order
    this.persist(
      PersistenceKey.PLOT_COMPARISON_PATHS_ORDER,
      this.comparisonPathsOrder
    )
  }

  public hasPaths() {
    return this.data.length > 0
  }

  private getPathsByType(
    type: PathType,
    filter = (type: PathType, plotPath: PlotPath) =>
      !!(plotPath.type?.has(type) && this.status[plotPath.path])
  ) {
    return this.data
      .filter(plotPath => filter(type, plotPath))
      .map(({ path }) => path)
  }

  private filterChildren(path: string | undefined): PlotPath[] {
    return this.data.filter(element => {
      if (!path) {
        return !element.parentPath
      }
      return element.parentPath === path
    })
  }
}
