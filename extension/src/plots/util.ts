import { PlotsOutput, PlotsOutputOrError } from '../cli/dvc/contract'
import { isDvcError } from '../cli/dvc/reader'
import { standardisePath } from '../fileSystem/util'

export const standardisePlotsDataPaths = (
  plotsData: PlotsOutputOrError
): PlotsOutputOrError => {
  if (isDvcError(plotsData)) {
    return plotsData
  }
  const standardisedData: PlotsOutput = { data: {} }
  const { data, errors } = plotsData

  for (const path of Object.keys(data)) {
    standardisedData.data[standardisePath(path)] = data[path]
  }

  if (!errors) {
    return standardisedData
  }
  standardisedData.errors = errors.map(error => {
    if (!error.name) {
      return error
    }

    return { ...error, name: standardisePath(error.name) }
  })

  return standardisedData
}
