import { FilterDefinition, Operator } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { getInput } from '../../../vscode/inputBox'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { reportError } from '../../../vscode/reporting'
import { pickFromParamsAndMetrics } from '../../paramsAndMetrics/quickPick'
import { ParamOrMetric } from '../../webview/contract'

export const operators = [
  {
    description: 'Equal',
    label: '=',
    types: ['number', 'string'],
    value: Operator.EQUAL
  },
  {
    description: 'Not equal',
    label: Operator.NOT_EQUAL,
    types: ['number', 'string'],
    value: Operator.NOT_EQUAL
  },
  {
    description: 'Is true',
    label: Operator.IS_TRUE,
    types: ['boolean'],
    value: Operator.IS_TRUE
  },
  {
    description: 'Is false',
    label: Operator.IS_FALSE,
    types: ['boolean'],
    value: Operator.IS_FALSE
  },
  {
    description: 'Greater than',
    label: Operator.GREATER_THAN,
    types: ['number'],
    value: Operator.GREATER_THAN
  },
  {
    description: 'Greater than or equal',
    label: Operator.GREATER_THAN_OR_EQUAL,
    types: ['number'],
    value: Operator.GREATER_THAN_OR_EQUAL
  },
  {
    description: 'Less than',
    label: Operator.LESS_THAN,
    types: ['number'],
    value: Operator.LESS_THAN
  },
  {
    description: 'Less than or equal',
    label: Operator.LESS_THAN_OR_EQUAL,
    types: ['number'],
    value: Operator.LESS_THAN_OR_EQUAL
  },
  {
    description: 'Contains',
    label: Operator.CONTAINS,
    types: ['string'],
    value: Operator.CONTAINS
  },
  {
    description: 'Does not contain',
    label: Operator.NOT_CONTAINS,
    types: ['string'],
    value: Operator.NOT_CONTAINS
  }
]

const addFilterValue = async (path: string, operator: Operator) => {
  const value = await getInput('Enter a filter value')
  if (!value) {
    return
  }

  return {
    operator: operator,
    path,
    value
  }
}

export const pickFilterToAdd = async (
  paramsAndMetrics: ParamOrMetric[] | undefined
): Promise<FilterDefinition | undefined> => {
  const picked = await pickFromParamsAndMetrics(paramsAndMetrics, {
    title: 'Select a param or metric to filter by'
  })
  if (!picked) {
    return
  }

  const typedOperators = operators.filter(operator =>
    operator.types.some(type => picked.types?.includes(type))
  )

  const operator = await quickPickValue<Operator>(typedOperators, {
    title: 'Select an operator'
  })
  if (!operator) {
    return
  }

  if ([Operator.IS_TRUE, Operator.IS_FALSE].includes(operator)) {
    return {
      operator: operator,
      path: picked.path,
      value: undefined
    }
  }

  return addFilterValue(picked.path, operator)
}

export const pickFiltersToRemove = (
  filters: FilterDefinition[]
): Thenable<FilterDefinition[] | undefined> => {
  if (!definedAndNonEmpty(filters)) {
    return reportError('There are no filters to remove.')
  }

  return quickPickManyValues<FilterDefinition>(
    filters.map(filter => ({
      description: [filter.operator, filter.value].join(' '),
      label: filter.path,
      value: filter
    })),
    {
      title: 'Select filter(s) to remove'
    }
  )
}
