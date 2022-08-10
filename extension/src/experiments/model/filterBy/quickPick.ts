import { FilterDefinition, getFilterId, Operator } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { getInput } from '../../../vscode/inputBox'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { Title } from '../../../vscode/title'
import { Toast } from '../../../vscode/toast'
import { ColumnLike } from '../../columns/like'
import { pickFromColumnLikes } from '../../columns/quickPick'

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
  const value = await getInput(Title.ENTER_FILTER_VALUE)
  if (!value) {
    return
  }

  return {
    operator,
    path,
    value
  }
}

export const pickFilterToAdd = async (
  columns: ColumnLike[] | undefined
): Promise<FilterDefinition | undefined> => {
  const picked = await pickFromColumnLikes(columns, {
    title: Title.SELECT_PARAM_OR_METRIC_FILTER
  })
  if (!picked) {
    return
  }

  const typedOperators = operators.filter(operator =>
    operator.types.some(type => picked.types?.includes(type))
  )

  const operator = await quickPickValue<Operator>(typedOperators, {
    title: Title.SELECT_OPERATOR
  })
  if (!operator) {
    return
  }

  if ([Operator.IS_TRUE, Operator.IS_FALSE].includes(operator)) {
    return {
      operator,
      path: picked.path,
      value: undefined
    }
  }

  return addFilterValue(picked.path, operator)
}

export const pickFiltersToRemove = (
  filters: FilterDefinition[]
): Thenable<string[] | undefined> => {
  if (!definedAndNonEmpty(filters)) {
    return Toast.showError('There are no filters to remove.')
  }

  return quickPickManyValues(
    filters.map(filter => ({
      description: [filter.operator, filter.value].join(' '),
      label: filter.path,
      value: getFilterId(filter)
    })),
    {
      title: Title.SELECT_FILTERS_TO_REMOVE
    }
  )
}
