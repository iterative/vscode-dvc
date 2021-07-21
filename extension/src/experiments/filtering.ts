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
  value: T,
  operator: string,
  valueToEvaluate: T
): boolean => {
  if (operator === '>') {
    return value > valueToEvaluate
  }
  if (operator === '<') {
    return value < valueToEvaluate
  }
  if (operator === '===') {
    return value === valueToEvaluate
  }

  if (operator === '>=') {
    return value >= valueToEvaluate
  }

  if (operator === '<=') {
    return value <= valueToEvaluate
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

      return !evaluate(value, filter.operator, filter.value)
    })
    return !firstFailure
  }

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
