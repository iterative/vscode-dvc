import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentsOutput
} from '../../cli/dvc/contract'
import { uniqueValues } from '../../util/array'

export const collectFiles = (
  data: ExperimentsOutput,
  existingFiles: string[]
): string[] => {
  return uniqueValues([
    ...Object.keys({
      ...data?.[EXPERIMENT_WORKSPACE_ID].baseline?.data?.params,
      ...data?.[EXPERIMENT_WORKSPACE_ID].baseline?.data?.metrics,
      ...data?.[EXPERIMENT_WORKSPACE_ID]?.baseline?.data?.deps
    }).filter(Boolean),
    ...existingFiles
  ])
}
