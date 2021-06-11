import { Disposer } from '@hediet/std/disposable'

export const reset = <T>(disposables: T, disposer: Disposer): T => {
  Object.values(disposables).forEach(disposable => {
    disposer.untrack(disposable)
    disposable.dispose()
  })
  disposables = {} as T
  return disposables
}
