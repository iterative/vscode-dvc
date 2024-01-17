import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import isEqual from 'lodash/isEqual'
import {
  Column as ExtensionColumn,
  ColumnType,
  Experiment,
  TableData
} from 'dvc/src/experiments/webview/contract'
import { keepEqualOldReferencesInArray } from '../../util/array'
import { keepReferenceIfEqual } from '../../util/objects'

export type Column = {
  label: string
  path: string
  type: ColumnType
  pathArray?: string[]
  width?: number
}

export type Columns = {
  [parentPath: string]: Column[]
}

export interface TableDataState extends TableData {
  hasData?: boolean
  columnData: Columns
}

export const tableDataInitialState: TableDataState = {
  changes: [],
  cliError: null,
  columnData: {},
  columnOrder: [],
  columnWidths: {},
  columns: [],
  filters: [],
  hasBranchesToSelect: true,
  hasConfig: false,
  hasData: false,
  hasMoreCommits: {},
  hasRunningWorkspaceExperiment: false,
  isShowingMoreCommits: {},
  rows: [],
  selectedBranches: [],
  selectedForPlotsCount: 0,
  showOnlyChanged: false,
  sorts: []
}

const getColumn = ({
  path,
  pathArray,
  type,
  width,
  label
}: {
  path: string
  pathArray?: string[]
  type: ColumnType
  width?: number
  label: string
}): Column => {
  const column: Column = {
    label,
    path,
    type
  }
  if (pathArray) {
    column.pathArray = pathArray
  }
  if (width) {
    column.width = width
  }
  return column
}

export const collectColumnData = (columns: ExtensionColumn[]): Columns => {
  const acc: Columns = {}

  for (const { path, parentPath, pathArray, type, width, label } of columns) {
    const column: Column = getColumn({
      label,
      path,
      pathArray,
      type,
      width
    })

    const key = parentPath || type

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(column)
  }

  return acc
}

export const tableDataSlice = createSlice({
  initialState: tableDataInitialState,
  name: 'tableData',
  reducers: {
    update: (state, action: PayloadAction<boolean>) => {
      state.hasData = action.payload
      if (!action.payload) {
        return tableDataInitialState
      }
    },
    updateChanges: (state, action: PayloadAction<string[]>) => {
      state.changes = action.payload
    },
    updateCliError: (state, action: PayloadAction<string | null>) => {
      state.cliError = action.payload
    },
    updateColumnOrder: (state, action: PayloadAction<string[]>) => {
      state.columnOrder = action.payload
    },
    updateColumnWidths: (
      state,
      action: PayloadAction<Record<string, number>>
    ) => {
      state.columnWidths = keepReferenceIfEqual(
        state.columnWidths,
        action.payload
      )
    },
    updateColumns: (state, action: PayloadAction<ExtensionColumn[]>) => {
      if (isEqual(state.columns, action.payload)) {
        return
      }

      state.columns = action.payload

      const columnData = collectColumnData(action.payload)

      if (isEqual(state.columnData, columnData)) {
        return
      }
      state.columnData = columnData
    },
    updateFilters: (state, action: PayloadAction<string[]>) => {
      state.filters = action.payload
    },
    updateHasBranchesToSelect: (state, action: PayloadAction<boolean>) => {
      state.hasBranchesToSelect = action.payload
    },
    updateHasConfig: (state, action: PayloadAction<boolean>) => {
      state.hasConfig = action.payload
    },
    updateHasMoreCommits: (
      state,
      action: PayloadAction<Record<string, boolean>>
    ) => {
      state.hasMoreCommits = keepReferenceIfEqual(
        state.hasMoreCommits,
        action.payload
      )
    },
    updateHasRunningWorkspaceExperiment: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.hasRunningWorkspaceExperiment = action.payload
    },
    updateIsShowingMoreCommits: (
      state,
      action: PayloadAction<Record<string, boolean>>
    ) => {
      state.isShowingMoreCommits = keepReferenceIfEqual(
        state.isShowingMoreCommits,
        action.payload
      )
    },
    updateRows: (state, action: PayloadAction<Experiment[]>) => {
      state.rows = keepEqualOldReferencesInArray(state.rows, action.payload)
    },
    updateSelectedBranches: (state, action: PayloadAction<string[]>) => {
      state.selectedBranches = action.payload
    },
    updateSelectedForPlotsCount: (state, action: PayloadAction<number>) => {
      state.selectedForPlotsCount = action.payload
    },
    updateShowOnlyChanged: (state, action: PayloadAction<boolean>) => {
      state.showOnlyChanged = action.payload
    },
    updateSorts: (state, action: PayloadAction<SortDefinition[]>) => {
      state.sorts = keepEqualOldReferencesInArray(state.sorts, action.payload)
    }
  }
})

export const {
  update,
  updateChanges,
  updateCliError,
  updateColumnOrder,
  updateColumns,
  updateColumnWidths,
  updateFilters,
  updateHasBranchesToSelect,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateIsShowingMoreCommits,
  updateRows,
  updateSelectedBranches,
  updateSelectedForPlotsCount,
  updateShowOnlyChanged,
  updateSorts
} = tableDataSlice.actions

export default tableDataSlice.reducer
