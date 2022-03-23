import { Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import {
  collectPaths,
  collectTemplateOrder,
  PathType,
  PlotPath,
  TemplateOrder
} from './collect'
import { PlotsOutput } from '../../cli/reader'
import { PathSelectionModel } from '../../path/selection/model'
import { MementoPrefix } from '../../vscode/memento'
import { getPathArray } from '../../fileSystem/util'

export class PathsModel extends PathSelectionModel<PlotPath> {
  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private templateOrder: TemplateOrder = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState, MementoPrefix.PLOT_PATH_STATUS, getPathArray)
  }

  public transformAndSet(data: PlotsOutput) {
    const paths = collectPaths(data)

    this.setNewStatuses(paths)

    this.data = paths

    this.setTemplateOrder()

    this.deferred.resolve()
  }

  public isReady() {
    return this.initialized
  }

  public setTemplateOrder(templateOrder?: TemplateOrder) {
    this.templateOrder = collectTemplateOrder(
      this.getPathsByType(PathType.TEMPLATE_SINGLE),
      this.getPathsByType(PathType.TEMPLATE_MULTI),
      templateOrder || this.templateOrder
    )
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
    return this.templateOrder
  }

  public getComparisonPaths() {
    return this.getPathsByType(PathType.COMPARISON)
  }

  private getPathsByType(type: PathType) {
    return this.data
      .filter(
        plotPath => plotPath.type?.has(type) && this.status[plotPath.path]
      )
      .map(({ path }) => path)
  }
}
