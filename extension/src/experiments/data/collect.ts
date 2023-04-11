import { ExpShowOutput } from '../../cli/dvc/contract'
import { uniqueValues } from '../../util/array'
import { getData_ } from '../columns/collect'

export const collectFiles = (
  output: ExpShowOutput,
  existingFiles: string[]
): string[] => {
  const [workspace] = output

  const data = getData_(workspace)

  return uniqueValues([
    ...Object.keys({
      ...data?.params,
      ...data?.metrics
    }).filter(Boolean),
    ...existingFiles
  ])
}
