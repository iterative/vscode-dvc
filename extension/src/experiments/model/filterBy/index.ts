import get from 'lodash.get'
import { compareDateStrings } from './date'
import { Experiment } from '../../webview/contract'
import { definedAndNonEmpty } from '../../../util/array'
import { splitColumnPath } from '../../columns/paths'

export enum Operator {
  EQUAL = '=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  NOT_EQUAL = '≠',

  NOT_MISSING = '≠Ø',

  CONTAINS = '∈',
  NOT_CONTAINS = '∉',

  IS_TRUE = '⊤',
  IS_FALSE = '⊥',

  BEFORE_DATE = '<d',
  AFTER_DATE = '>d',
  ON_DATE = '=d'
}

export const isDateOperator = (operator: Operator): boolean =>
  [Operator.AFTER_DATE, Operator.BEFORE_DATE, Operator.ON_DATE].includes(
    operator
  )

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

const evaluate = <T extends string | number | boolean>(
  valueToEvaluate: T,
  operator: Operator,
  filterValue: T
): boolean => {
  if (valueToEvaluate === undefined) {
    return operator !== Operator.NOT_MISSING
  }
  switch (operator) {
    case Operator.NOT_MISSING:
      return true
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

    case Operator.AFTER_DATE:
      return compareDateStrings(
        valueToEvaluate,
        Operator.GREATER_THAN,
        filterValue
      )
    case Operator.BEFORE_DATE:
      return compareDateStrings(
        valueToEvaluate,
        Operator.LESS_THAN,
        filterValue
      )
    case Operator.ON_DATE:
      return compareDateStrings(valueToEvaluate, Operator.EQUAL, filterValue)
    default:
      throw new Error('filter operator not found')
  }
}

const buildFilter =
  (
    filterDefinitions: FilterDefinition[]
  ): ((experiment: Experiment) => boolean) =>
  experiment => {
    const firstFailure = filterDefinitions.find(filter => {
      const pathArray = splitColumnPath(filter.path)
      const value = get(experiment, pathArray) as string | number | boolean

      return !evaluate<typeof value>(
        value,
        filter.operator,
        filter.value as string | number | boolean
      )
    })
    return !firstFailure
  }

export const getFilterId = (filter: FilterDefinition): string =>
  [filter.path, filter.operator, filter.value].join('')

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
