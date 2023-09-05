import { PlotsOutput, PlotsOutputOrError } from '../cli/dvc/contract'
import { isDvcError } from '../cli/dvc/reader'
import { ensureOsFileSep } from '../fileSystem/util'

export const ensurePlotsDataPathsOsSep = (
  plotsData: PlotsOutputOrError
): PlotsOutputOrError => {
  if (isDvcError(plotsData)) {
    return plotsData
  }
  const standardisedData: PlotsOutput = { data: {} }
  const { data, errors } = plotsData

  for (const path of Object.keys(data)) {
    standardisedData.data[ensureOsFileSep(path)] = data[path]
  }

  if (!errors) {
    return standardisedData
  }
  standardisedData.errors = errors.map(error => {
    if (!error.name) {
      return error
    }

    return { ...error, name: ensureOsFileSep(error.name) }
  })

  return standardisedData
}
