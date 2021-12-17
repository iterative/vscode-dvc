import get from 'lodash.get'
import { Experiment } from '../../webview/contract'
import { definedAndNonEmpty } from '../../../util/array'
import { splitMetricOrParamPath } from '../../metricsAndParams/paths'

export enum Operator {
  EQUAL = '==',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  NOT_EQUAL = '!=',

  CONTAINS = '∈',
  NOT_CONTAINS = '!∈',

  IS_TRUE = '⊤',
  IS_FALSE = '⊥'
}

export interface FilterDefinition {
  path: string
  operator: Operator
  value: string | number | undefined
}

const stringContains = (
  valueToEvaluate: unknown,
  filterValue: unknown
): boolean =>
  !!(
    typeof valueToEvaluate === 'string' &&
    typeof filterValue === 'string' &&
    valueToEvaluate.includes(filterValue)
  )

const evaluateBoolean = (
  valueToEvaluate: unknown,
  filterValue: boolean
): boolean =>
  typeof valueToEvaluate === 'boolean' && valueToEvaluate === filterValue

const evaluate = <T>(
  valueToEvaluate: T,
  operator: Operator,
  filterValue: T
): boolean => {
  switch (operator) {
    case Operator.GREATER_THAN:
      return valueToEvaluate > filterValue
    case Operator.LESS_THAN:
      return valueToEvaluate < filterValue
    case Operator.EQUAL:
      // eslint-disable-next-line eqeqeq
      return valueToEvaluate == filterValue
    case Operator.GREATER_THAN_OR_EQUAL:
      return valueToEvaluate >= filterValue
    case Operator.LESS_THAN_OR_EQUAL:
      return valueToEvaluate <= filterValue
    case Operator.NOT_EQUAL:
      // eslint-disable-next-line eqeqeq
      return valueToEvaluate != filterValue
    case Operator.IS_TRUE:
      return evaluateBoolean(valueToEvaluate, true)
    case Operator.IS_FALSE:
      return evaluateBoolean(valueToEvaluate, false)
    case Operator.CONTAINS:
      return stringContains(valueToEvaluate, filterValue)
    case Operator.NOT_CONTAINS:
      return !stringContains(valueToEvaluate, filterValue)
    default:
      throw Error('filter operator not found')
  }
}

const buildFilter =
  (
    filterDefinitions: FilterDefinition[]
  ): ((experiment: Experiment) => boolean) =>
  experiment => {
    const firstFailure = filterDefinitions.find(filter => {
      const pathArray = splitMetricOrParamPath(filter.path)
      const value = get(experiment, pathArray)

      return !evaluate<typeof value>(value, filter.operator, filter.value)
    })
    return !firstFailure
  }

export const getFilterId = (filter: FilterDefinition): string =>
  [filter.path, filter.operator, filter.value].join('')

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
