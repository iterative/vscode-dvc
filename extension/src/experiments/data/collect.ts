import { ExpShowOutput } from '../../cli/dvc/contract'
import { uniqueValues } from '../../util/array'
import { getData } from '../columns/collect'

export const collectFiles = (
  output: ExpShowOutput,
  existingFiles: string[]
): string[] => {
  if (!output?.length) {
    return existingFiles
  }

  const [workspace] = output

  const data = getData(workspace)

  return uniqueValues([
    ...Object.keys({
      ...data?.params,
      ...data?.metrics
    }).filter(Boolean),
    ...existingFiles
  ])
}
