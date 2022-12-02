import { ExperimentsOutput } from '../../cli/dvc/contract'
import { uniqueValues } from '../../util/array'

export const collectFiles = (
  data: ExperimentsOutput,
  existingFiles: string[]
): string[] => {
  return uniqueValues([
    ...Object.keys({
      ...data?.workspace.baseline?.data?.params,
      ...data?.workspace.baseline?.data?.metrics
    }).filter(Boolean),
    ...existingFiles
  ])
}
