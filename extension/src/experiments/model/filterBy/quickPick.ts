import { FilterDefinition, getFilterId, isDateOperator, Operator } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { getInput, getValidDateInput } from '../../../vscode/inputBox'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { Title } from '../../../vscode/title'
import { Toast } from '../../../vscode/toast'
import { ColumnLike } from '../../columns/like'
import { pickFromColumnLikes } from '../../columns/quickPick'
import { ColumnType } from '../../webview/contract'

export const OPERATORS = [
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
    description: 'Not Missing',
    label: Operator.NOT_MISSING,
    types: ['string', 'boolean', 'number'],
    value: Operator.NOT_MISSING
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
  },
  {
    description: 'After Date',
    label: Operator.AFTER_DATE,
    types: [ColumnType.TIMESTAMP],
    value: Operator.AFTER_DATE
  },
  {
    description: 'Before Date',
    label: Operator.BEFORE_DATE,
    types: [ColumnType.TIMESTAMP],
    value: Operator.BEFORE_DATE
  },
  {
    description: 'On Day',
    label: Operator.ON_DATE,
    types: [ColumnType.TIMESTAMP],
    value: Operator.ON_DATE
  },
  {
    description: 'Git Tag Equal',
    label: '=',
    types: ['tags'],
    value: Operator.EQUAL
  },
  {
    description: 'Git Tag Contains',
    label: Operator.CONTAINS,
    types: ['tags'],
    value: Operator.CONTAINS
  }
]

const getValue = (operator: Operator): Thenable<string | undefined> => {
  if (isDateOperator(operator)) {
    return getValidDateInput(Title.ENTER_FILTER_VALUE)
  }
  return getInput(Title.ENTER_FILTER_VALUE)
}

const addFilterValue = async (path: string, operator: Operator) => {
  const value = await getValue(operator)
  if (!value) {
    return
  }

  return {
    operator,
    path,
    value
  }
}

export const pickColumnToFilter = (
  columns: ColumnLike[] | undefined
): Thenable<ColumnLike | undefined> =>
  pickFromColumnLikes(columns, {
    title: Title.SELECT_COLUMN_FILTER
  })

export const pickFilterToAdd = async ({
  firstValueType,
  path
}: ColumnLike): Promise<FilterDefinition | undefined> => {
  const typedOperators = OPERATORS.filter(
    operator => firstValueType && operator.types.includes(firstValueType)
  )

  const operator = await quickPickValue<Operator>(typedOperators, {
    title: Title.SELECT_OPERATOR
  })
  if (!operator) {
    return
  }

  if (
    [Operator.IS_TRUE, Operator.IS_FALSE, Operator.NOT_MISSING].includes(
      operator
    )
  ) {
    return {
      operator,
      path,
      value: undefined
    }
  }

  return addFilterValue(path, operator)
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
