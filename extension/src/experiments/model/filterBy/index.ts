import get from 'lodash.get'
import { Experiment } from '../../webview/contract'
import { definedAndNonEmpty } from '../../../util/array'
import { splitColumnPath } from '../../columns/paths'

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

const evaluate = <T extends string | number | boolean>(
  valueToEvaluate: T,
  operator: Operator,
  filterValue: T
): boolean => {
  if (valueToEvaluate === undefined) {
    return true
  }
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
      const value = get(experiment, pathArray)

      return !evaluate<typeof value>(value, filter.operator, filter.value)
    })
    return !firstFailure
  }

export const getFilterId = (filter: FilterDefinition): string =>
  [filter.path, filter.operator, filter.value].join('')

interface FilteredExperimentsAccumulator<T extends Experiment> {
  filtered: T[]
  unfiltered: T[]
}

export const splitExperimentsByFilters = <T extends Experiment>(
  filterDefinitions: FilterDefinition[],
  unfilteredExperiments: T[]
): FilteredExperimentsAccumulator<T> => {
  if (!definedAndNonEmpty(filterDefinitions)) {
    return { filtered: [], unfiltered: unfilteredExperiments }
  }
  const filterFunction = buildFilter(filterDefinitions)

  const acc: FilteredExperimentsAccumulator<T> = {
    filtered: [],
    unfiltered: []
  }

  for (const experiment of unfilteredExperiments) {
    if (filterFunction(experiment)) {
      acc.unfiltered.push(experiment)
      continue
    }
    acc.filtered.push(experiment)
  }

  return acc
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
