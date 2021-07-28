import { sep } from 'path'
import get from 'lodash.get'
import { Experiment } from '../webview/contract'

export interface SortDefinition {
  descending: boolean
  path: string
}

const compareExperimentsByPath = (
  path: string[],
  a: Experiment,
  b: Experiment
): number => {
  const valueA = get(a, path)
  const valueB = get(b, path)
  return valueA === valueB ? 0 : valueA < valueB ? -1 : 1
}

const buildExperimentSortFunction = ({
  path,
  descending
}: SortDefinition): ((a: Experiment, b: Experiment) => number) => {
  const pathArray = path.split(sep)
  return descending
    ? (a, b) => compareExperimentsByPath(pathArray, b, a)
    : (a, b) => compareExperimentsByPath(pathArray, a, b)
}

export const sortExperiments = (
  sortDefinition: SortDefinition | undefined,
  unsortedRows: Experiment[]
): Experiment[] => {
  if (!sortDefinition) {
    return unsortedRows
  }
  const sortFunction = buildExperimentSortFunction(
    sortDefinition as SortDefinition
  )
  return unsortedRows.sort(sortFunction)
}
