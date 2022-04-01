import { Disposable as StdDisposable } from '@hediet/std/disposable'

export abstract class Disposable {
  public readonly dispose = StdDisposable.fn()
}
