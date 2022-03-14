import { Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { collectPaths, PathType, PlotPath } from './collect'
import { PlotsOutput } from '../../cli/reader'
import { PathSelectionModel } from '../../path/selection/model'
import { MementoPrefix } from '../../vscode/memento'
import { getPathArray } from '../../fileSystem/util'

export class PathsModel extends PathSelectionModel<PlotPath> {
  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState, MementoPrefix.PLOT_PATH_STATUS, getPathArray)
  }

  public transformAndSet(data: PlotsOutput) {
    const paths = collectPaths(data)

    this.data = paths

    this.deferred.resolve()
  }

  public isReady() {
    return this.initialized
  }

  public filterChildren(path: string | undefined): PlotPath[] {
    return this.data.filter(element => {
      if (!path) {
        return !element.parentPath
      }
      return element.parentPath === path
    })
  }

  public getTemplatePaths() {
    return this.getPathsByType(PathType.TEMPLATE)
  }

  public getComparisonPaths() {
    return this.getPathsByType(PathType.COMPARISON)
  }

  private getPathsByType(type: PathType) {
    return this.data
      .filter(path => path.type?.has(type))
      .map(({ path }) => path)
  }
}
