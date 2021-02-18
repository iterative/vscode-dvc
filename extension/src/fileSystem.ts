import { Disposable } from '@hediet/std/disposable'
import fs from 'fs'
import debounce from 'lodash.debounce'

export const addFileChangeHandler = (
  file: string,
  handler: () => void
): Disposable => {
  const watcher = getWatcher(handler)

  const debouncedWatcher = debounce(watcher, 1500, {
    leading: true,
    trailing: false
  })

  const fileWatcher = fs.watch(file, debouncedWatcher)

  return {
    dispose: () => {
      fileWatcher.close()
    }
  }
}

export const getWatcher = (handler: () => void) => (
  event: 'rename' | 'change',
  filename: string
): void => {
  if (filename && event === 'change') {
    handler()
  }
}
