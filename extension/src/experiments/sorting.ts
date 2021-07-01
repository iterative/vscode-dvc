import { get } from 'lodash'
import { Experiment } from './webview/contract'

export interface SortDefinition {
  descending: boolean
  columnPath: string[]
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

export const buildExperimentSortFunction = ({
  columnPath,
  descending
}: SortDefinition): ((a: Experiment, b: Experiment) => number) =>
  descending
    ? (a, b) => compareExperimentsByPath(columnPath, a, b)
    : (a, b) => compareExperimentsByPath(columnPath, b, a)
