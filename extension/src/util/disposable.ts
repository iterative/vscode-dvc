import { Disposable, Disposer } from '@hediet/std/disposable'

export type Disposables<T> = Record<string, T>

export const reset = <T extends Disposable>(
  disposables: Disposables<T>,
  disposer: Disposer
): Disposables<T> => {
  for (const disposable of Object.values(disposables)) {
    disposer.untrack(disposable)
    disposable.dispose()
  }
  disposables = {} as Disposables<T>
  return disposables
}
