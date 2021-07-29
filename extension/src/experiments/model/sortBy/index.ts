import { sep } from 'path'
import get from 'lodash.get'
import { Experiment } from '../../webview/contract'

export interface SortDefinition {
  descending: boolean
  path: string
}

type SortFunction = (a: Experiment, b: Experiment) => number

const compareExperimentsByPath = (
  path: string[],
  a: Experiment,
  b: Experiment
): number => {
  const valueA = get(a, path)
  const valueB = get(b, path)
  return valueA === valueB ? 0 : valueA < valueB ? -1 : 1
}

const buildSingleExperimentSortFunction = ({
  path,
  descending
}: SortDefinition): SortFunction => {
  const pathArray = path.split(sep)
  return descending
    ? (a, b) => compareExperimentsByPath(pathArray, b, a)
    : (a, b) => compareExperimentsByPath(pathArray, a, b)
}

const buildMultiExperimentSortFunction = (
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

const buildExperimentSortFunction = (
  sortDefinitions: SortDefinition[]
): SortFunction =>
  sortDefinitions.length === 1
    ? buildSingleExperimentSortFunction(sortDefinitions[0])
    : buildMultiExperimentSortFunction(sortDefinitions)

export const sortExperiments = (
  sortDefinitions: SortDefinition[],
  unsortedRows: Experiment[]
): Experiment[] =>
  sortDefinitions.length === 0
    ? unsortedRows
    : unsortedRows.sort(buildExperimentSortFunction(sortDefinitions))
