import { QuickPickOptions, window } from 'vscode'
import { ColumnData } from './webview/contract'
import { SortDefinition } from './sorting'
import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { getInput } from '../vscode/inputBox'

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
  columnData: ColumnData[],
  quickPickOptions: QuickPickOptions
) =>
  quickPickValue<ColumnData>(
    columnData.map(column => ({
      description: column.path,
      label: column.name,
      value: column
    })),
    quickPickOptions
  )

export const pickSort = async (
  columnData: ColumnData[] | undefined
): Promise<SortDefinition | undefined> => {
  if (!columnData || columnData.length === 0) {
    window.showErrorMessage('There are no columns to sort with')
    return
  }
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

interface FilterDefinition {
  columnPath: string
  operator: string
  value: string | number
}

const operators = [
  { description: 'Equal', label: '=', value: '===' },
  { description: 'Greater than', label: '>', value: '>' },
  { description: 'Greater than or equal to', label: '>=', value: '>=' },
  { description: 'Less than', label: '<', value: '<' },
  { description: 'Less than or equal to', label: '<=', value: '<=' }
]

export const pickFilter = async (
  columnData: ColumnData[] | undefined
): Promise<FilterDefinition | undefined> => {
  if (!columnData || columnData.length === 0) {
    window.showErrorMessage('There are no columns to filter by')
    return
  }
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
