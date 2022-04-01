import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'

export abstract class BaseClass {
  public readonly dispose = Disposable.fn()
}

export abstract class BaseDeferredClass extends BaseClass {
  protected readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }
}
