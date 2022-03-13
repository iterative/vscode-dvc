import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { collectPaths, PathType, PlotPath } from './collect'
import { PlotsOutput } from '../../cli/reader'

export class PathsModel {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private data: PlotPath[] = []

  public transformAndSet(data: PlotsOutput) {
    const paths = collectPaths(data)

    this.data = paths

    this.deferred.resolve()
  }

  public isReady() {
    return this.initialized
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
