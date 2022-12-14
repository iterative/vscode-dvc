import { Disposable } from '@hediet/std/disposable'

export type Disposables<T> = Record<string, T>

export const reset = <T extends Disposable>(
  disposables: Disposables<T>,
  untrack: (disposable: T) => void
): Disposables<T> => {
  for (const disposable of Object.values(disposables)) {
    untrack(disposable)
    disposable.dispose()
  }
  disposables = {} as Disposables<T>
  return disposables
}
