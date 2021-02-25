import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'

export const addFileChangeHandler = (
  file: string,
  handler: () => void
): Disposable => {
  const watcher = getWatcher(handler)

  const debouncedWatcher = debounce(watcher, 1500, {
    leading: false,
    trailing: true
  })

  const fileWatcher = chokidar.watch(file)

  fileWatcher.on('ready', debouncedWatcher)
  fileWatcher.on('add', debouncedWatcher)
  fileWatcher.on('change', debouncedWatcher)
  fileWatcher.on('unlink', debouncedWatcher)

  return {
    dispose: () => {
      fileWatcher.close()
    }
  }
}

export const getWatcher = (handler: () => void) => (path: string): void => {
  if (path) {
    handler()
  }
}
