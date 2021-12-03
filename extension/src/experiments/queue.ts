import { exists, readCsv } from '../fileSystem'
import { join } from '../test/util/path'
import { definedAndNonEmpty } from '../util/array'
import { delay } from '../util/time'

const reduceRow = (row: Record<string, unknown>) =>
  Object.entries(row).reduce((acc, [k, v]) => {
    const key = k.trim()
    const value = (v as string).trim()

    if (key !== '' && value !== '') {
      acc.push('-S')
      const str = [key, value].join('=')
      acc.push(str)
    }

    return acc
  }, [] as string[])

export const readToQueueFromCsv = (path: string): Promise<string[][]> =>
  new Promise(resolve => {
    const toQueue: string[][] = []
    readCsv(path)
      .on('data', row => {
        const arr = reduceRow(row)
        if (definedAndNonEmpty(arr)) {
          toQueue.push(arr)
        }
      })
      .on('end', () => {
        resolve(toQueue)
      })
  })

export const waitForLock = async (cwd: string): Promise<void> => {
  const lock = join(cwd, '.dvc', 'rwlock')

  if (exists(lock)) {
    await delay(2000)
    return waitForLock(cwd)
  }
}
