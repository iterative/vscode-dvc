import { QuickPickOptions, window } from 'vscode'
import { ParamOrMetric } from './webview/contract'
import { FilterDefinition, Operator } from './model/filtering'
import { SortDefinition } from './model/sorting'
import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { getInput } from '../vscode/inputBox'
import { definedAndNonEmpty } from '../util/array'

export const pickExperimentName = async (
  experimentNamesPromise: Promise<string[]>
): Promise<string | undefined> => {
  const experimentNames = await experimentNamesPromise
  if (experimentNames.length === 0) {
    window.showErrorMessage('There are no experiments to select.')
  } else {
    return window.showQuickPick(experimentNames)
  }
}

export const pickGarbageCollectionFlags = () =>
  quickPickManyValues<GcPreserveFlag>(
    [
      {
        detail: 'Preserve Experiments derived from all Git branches',
        label: 'All Branches',
        value: GcPreserveFlag.ALL_BRANCHES
      },
      {
        detail: 'Preserve Experiments derived from all Git tags',
        label: 'All Tags',
        value: GcPreserveFlag.ALL_TAGS
      },
      {
        detail: 'Preserve Experiments derived from all Git commits',
        label: 'All Commits',
        value: GcPreserveFlag.ALL_COMMITS
      },
      {
        detail: 'Preserve all queued Experiments',
        label: 'Queued Experiments',
        value: GcPreserveFlag.QUEUED
      }
    ],
    { placeHolder: 'Select which Experiments to preserve' }
  )

export const pickFromParamsAndMetrics = (
  paramsAndMetrics: ParamOrMetric[] | undefined,
  quickPickOptions: QuickPickOptions
) => {
  if (!paramsAndMetrics || paramsAndMetrics.length === 0) {
    window.showErrorMessage('There are no params or metrics to select from')
    return
  }
  return quickPickValue<ParamOrMetric>(
    paramsAndMetrics.map(paramOrMetric => ({
      description: paramOrMetric.path,
      label: paramOrMetric.name,
      value: paramOrMetric
    })),
    quickPickOptions
  )
}

export const pickSort = async (
  paramsAndMetrics: ParamOrMetric[] | undefined
): Promise<SortDefinition | undefined> => {
  const picked = await pickFromParamsAndMetrics(paramsAndMetrics, {
    title: 'Select a param or metric to sort by'
  })
  if (picked === undefined) {
    return
  }
  const descending = await quickPickValue<boolean>(
    [
      { label: 'Ascending', value: false },
      { label: 'Descending', value: true }
    ],
    { title: 'Select a direction to sort in' }
  )
  if (descending === undefined) {
    return
  }
  return {
    descending,
    path: picked.path
  }
}

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
    window.showErrorMessage('There are no filters to remove.')
    return Promise.resolve(undefined)
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
