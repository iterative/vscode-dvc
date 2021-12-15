import { Flag } from '../../../cli/args'
import { readCsv } from '../../../fileSystem'
import { definedAndNonEmpty } from '../../../util/array'

const collectParamsToVary = (csvRow: Record<string, unknown>): string[] =>
  Object.entries(csvRow).reduce((acc, [k, v]) => {
    const key = k.trim()
    const value = (v as string).trim()

    if (key !== '' && value !== '') {
      acc.push(Flag.SET_PARAM)
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
        const paramsToVary = collectParamsToVary(row)
        if (definedAndNonEmpty(paramsToVary)) {
          toQueue.push(paramsToVary)
        }
      })
      .on('end', () => {
        resolve(toQueue)
      })
  })
