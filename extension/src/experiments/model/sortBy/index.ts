import { splitColumnPath } from '../../columns/paths'
import { Experiment } from '../../webview/contract'
import { getValue } from '../../columns/util'

export interface SortDefinition {
  descending: boolean
  path: string
}

type SortFunction = (a: Experiment, b: Experiment) => number

const compareExperimentsByPath = (
  pathArray: string[],
  a: Experiment,
  b: Experiment
): number => {
  const valueA = getValue(a, pathArray) as string | number
  const valueB = getValue(b, pathArray) as string | number
  if (valueA === valueB) {
    return 0
  }

  return valueA < valueB ? -1 : 1
}

const buildSingleExperimentSortFunction = ({
  path,
  descending
}: SortDefinition): SortFunction => {
  const pathArray = splitColumnPath(path)
  return descending
    ? (a, b) => compareExperimentsByPath(pathArray, b, a)
    : (a, b) => compareExperimentsByPath(pathArray, a, b)
}

const buildExperimentSortFunction = (
  sortDefinitions: SortDefinition[]
): SortFunction => {
  const sortFunctions = sortDefinitions.map(buildSingleExperimentSortFunction)
  return (a, b) => {
    for (const sortFunction of sortFunctions) {
      const result = sortFunction(a, b)
      if (result !== 0) {
        return result
      }
    }
    return 0
  }
}

export const sortExperiments = (
  sortDefinitions: SortDefinition[],
  unsortedRows: Experiment[]
): Experiment[] =>
  sortDefinitions.length === 0
    ? unsortedRows
    : [...unsortedRows].sort(buildExperimentSortFunction(sortDefinitions))
