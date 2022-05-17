import util from 'util'
import { DeferredDisposable } from './deferred'

class TestDeferredDisposable extends DeferredDisposable {
  public makeReady() {
    return this.deferred.resolve()
  }

  public getDeferred() {
    return this.deferred
  }
}

describe('DeferredDisposable', () => {
  it('should not reset the deferred property if consumers are still waiting for the promise to be be resolved or rejected', () => {
    const deferredDisposable = new TestDeferredDisposable()

    const deferred = deferredDisposable.getDeferred()

    deferredDisposable.resetDeferred()
    expect(deferred).toBe(deferredDisposable.getDeferred())
  })

  it('should reset the deferred property if the promise has been resolved', async () => {
    const deferredDisposable = new TestDeferredDisposable()

    const deferred = deferredDisposable.getDeferred()

    deferredDisposable.makeReady()
    await deferredDisposable.isReady()
    deferredDisposable.resetDeferred()

    const newDeferred = deferredDisposable.getDeferred()

    expect(deferred).not.toBe(newDeferred)
    expect(newDeferred.promise).toBeInstanceOf(Promise)
    expect(util.inspect(deferred.promise).includes('pending')).toBe(false)
    expect(util.inspect(newDeferred.promise).includes('pending')).toBe(true)
  })
})
