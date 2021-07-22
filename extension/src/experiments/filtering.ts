import { sep } from 'path'
import get from 'lodash.get'
import { Experiment } from './webview/contract'
import { definedAndNonEmpty } from '../util/array'

export interface FilterDefinition {
  columnPath: string
  operator: string
  value: string | number
}

const evaluate = <T>(
  valueToEvaluate: T,
  operator: string,
  filterValue: T
): boolean => {
  if (operator === '>') {
    return valueToEvaluate > filterValue
  }
  if (operator === '<') {
    return valueToEvaluate < filterValue
  }
  if (operator === '==') {
    // eslint-disable-next-line eqeqeq
    return valueToEvaluate == filterValue
  }

  if (operator === '>=') {
    return valueToEvaluate >= filterValue
  }

  if (operator === '<=') {
    return valueToEvaluate <= filterValue
  }
  throw Error('filter operator not found')
}

const buildFilter =
  (
    filterDefinitions: FilterDefinition[]
  ): ((experiment: Experiment) => boolean) =>
  experiment => {
    const firstFailure = filterDefinitions.find(filter => {
      const columnPathArray = filter.columnPath.split(sep)
      const value = get(experiment, columnPathArray)

      return !evaluate<typeof value>(value, filter.operator, filter.value)
    })
    return !firstFailure
  }

export const getFilterId = (filter: FilterDefinition): string =>
  [filter.columnPath, filter.operator, filter.value].join('')

export const filterExperiments = (
  filterDefinitions: FilterDefinition[],
  unfilteredExperiments: Experiment[]
): Experiment[] => {
  if (!definedAndNonEmpty(filterDefinitions)) {
    return unfilteredExperiments
  }
  const filterFunction = buildFilter(filterDefinitions)
  return unfilteredExperiments.filter(filterFunction)
}

export const filterExperiment = (
  filterDefinitions: FilterDefinition[],
  experiment: Experiment
): Experiment | undefined => {
  if (!definedAndNonEmpty(filterDefinitions)) {
    return experiment
  }
  const filterFunction = buildFilter(filterDefinitions)
  return filterFunction(experiment) ? experiment : undefined
}
