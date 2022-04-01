import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from './dispose'

export abstract class DeferredDisposable extends Disposable {
  protected readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }
}
