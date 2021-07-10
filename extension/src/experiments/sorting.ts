import path from 'path'
import get from 'lodash.get'
import { Experiment } from './webview/contract'

export interface SortDefinition {
  descending: boolean
  columnPath: string
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
  columnPath,
  descending
}: SortDefinition): ((a: Experiment, b: Experiment) => number) => {
  const columnPathArray = columnPath.split(path.sep)
  return descending
    ? (a, b) => compareExperimentsByPath(columnPathArray, b, a)
    : (a, b) => compareExperimentsByPath(columnPathArray, a, b)
}

export const sortRows = (
  sortDefinition: SortDefinition | undefined,
  unsortedRows: Experiment[] | undefined
) => {
  if (!sortDefinition || !unsortedRows) {
    return unsortedRows
  }
  const sortFunction = buildExperimentSortFunction(
    sortDefinition as SortDefinition
  )
  return unsortedRows.map(branch => {
    if (!branch.subRows) {
      return branch
    }
    const sortedRows = [...branch.subRows].sort(sortFunction)
    return {
      ...branch,
      subRows: sortedRows
    }
  })
}
