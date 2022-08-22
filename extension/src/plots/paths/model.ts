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

export class PathsModel extends PathSelectionModel<PlotPath> {
  private templateOrder: TemplateOrder

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState, PersistenceKey.PLOT_PATH_STATUS)

    this.templateOrder = this.revive(PersistenceKey.PLOT_TEMPLATE_ORDER, [])
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

  public filterChildren(path: string | undefined): PlotPath[] {
    return this.data.filter(element => {
      if (!path) {
        return !element.parentPath
      }
      return element.parentPath === path
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
    return this.getPathsByType(PathType.COMPARISON)
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
}
