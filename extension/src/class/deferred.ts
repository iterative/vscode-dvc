import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from './dispose'

export abstract class DeferredDisposable extends Disposable {
  protected deferred = new Deferred()
  private initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public resetDeferred() {
    this.deferred = new Deferred()
    this.initialized = this.deferred.promise
  }
}
