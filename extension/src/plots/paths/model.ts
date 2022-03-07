import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { collectPaths } from './collect'
import { PlotsOutput } from '../../cli/reader'

export class PathsModel {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private vegaPaths: string[] = []
  private comparisonPaths: string[] = []

  public transformAndSet(data: PlotsOutput) {
    const { comparison, plots } = collectPaths(data)

    this.vegaPaths = plots
    this.comparisonPaths = comparison

    this.deferred.resolve()
  }

  public isReady() {
    return this.initialized
  }

  public getVegaPaths() {
    return this.vegaPaths
  }

  public getComparisonPaths() {
    return this.comparisonPaths
  }
}
