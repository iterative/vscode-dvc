import { QuickPickOptions, window } from 'vscode'
import { ColumnData } from './webview/contract'
import { FilterDefinition } from './filtering'
import { SortDefinition } from './sorting'
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

export const pickFromColumnData = (
  columnData: ColumnData[] | undefined,
  quickPickOptions: QuickPickOptions
) => {
  if (!columnData || columnData.length === 0) {
    window.showErrorMessage('There are no columns to select from')
    return
  }
  return quickPickValue<ColumnData>(
    columnData.map(column => ({
      description: column.path,
      label: column.name,
      value: column
    })),
    quickPickOptions
  )
}

export const pickSort = async (
  columnData: ColumnData[] | undefined
): Promise<SortDefinition | undefined> => {
  const pickedColumn = await pickFromColumnData(columnData, {
    title: 'Select a column to sort by'
  })
  if (pickedColumn === undefined) {
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
    columnPath: pickedColumn.path,
    descending
  }
}

const operators = [
  { description: 'Equal', label: '=', value: '==' },
  { description: 'Greater than', label: '>', value: '>' },
  { description: 'Greater than or equal to', label: '>=', value: '>=' },
  { description: 'Less than', label: '<', value: '<' },
  { description: 'Less than or equal to', label: '<=', value: '<=' }
]

export const pickFilterToAdd = async (
  columnData: ColumnData[] | undefined
): Promise<FilterDefinition | undefined> => {
  const pickedColumn = await pickFromColumnData(columnData, {
    title: 'Select a column to filter by'
  })
  if (!pickedColumn) {
    return
  }

  const operator = await quickPickValue<string>(operators, {
    title: 'Select an operator'
  })
  if (!operator) {
    return
  }

  const value = await getInput('Enter a value')
  if (!value) {
    return
  }

  return {
    columnPath: pickedColumn.path,
    operator,
    value
  }
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
      label: filter.columnPath,
      value: filter
    })),
    {
      title: 'Select filter(s) to remove'
    }
  )
}
