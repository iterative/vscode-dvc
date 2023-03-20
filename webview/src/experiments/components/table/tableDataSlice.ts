import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FilteredCounts } from 'dvc/src/experiments/model/filterBy/collect'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Column, Row, TableData } from 'dvc/src/experiments/webview/contract'
import { keepEqualOldReferencesInArray } from '../../../util/array'
import { keepReferenceIfEqual } from '../../../util/objects'

export interface TableDataState extends TableData {
  hasData?: boolean
}

export const tableDataInitialState: TableDataState = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  columns: [],
  filteredCounts: {
    checkpoints: 0,
    experiments: 0
  },
  filters: [],
  hasCheckpoints: false,
  hasColumns: false,
  hasConfig: false,
  hasData: false,
  hasRunningExperiment: false,
  hasValidDvcYaml: true,
  rows: [],
  sorts: []
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
      ) as Record<string, number>
    },
    updateColumns: (state, action: PayloadAction<Column[]>) => {
      state.columns = keepEqualOldReferencesInArray(
        state.columns,
        action.payload
      ) as Column[]
    },
    updateFilteredCounts: (state, action: PayloadAction<FilteredCounts>) => {
      state.filteredCounts = keepReferenceIfEqual(
        state.filteredCounts,
        action.payload
      ) as FilteredCounts
    },
    updateFilters: (state, action: PayloadAction<string[]>) => {
      state.filters = action.payload
    },
    updateHasCheckpoints: (state, action: PayloadAction<boolean>) => {
      state.hasCheckpoints = action.payload
    },
    updateHasColumns: (state, action: PayloadAction<boolean>) => {
      state.hasColumns = action.payload
    },
    updateHasConfig: (state, action: PayloadAction<boolean>) => {
      state.hasConfig = action.payload
    },
    updateHasRunningExperiment: (state, action: PayloadAction<boolean>) => {
      state.hasRunningExperiment = action.payload
    },
    updateHasValidDvcYaml: (state, action: PayloadAction<boolean>) => {
      state.hasValidDvcYaml = action.payload
    },
    updateRows: (state, action: PayloadAction<Row[]>) => {
      state.rows = keepEqualOldReferencesInArray(
        state.rows,
        action.payload
      ) as Row[]
    },
    updateSorts: (state, action: PayloadAction<SortDefinition[]>) => {
      state.sorts = keepEqualOldReferencesInArray(
        state.sorts,
        action.payload
      ) as SortDefinition[]
    }
  }
})

export const {
  update,
  updateChanges,
  updateColumnOrder,
  updateColumnWidths,
  updateColumns,
  updateFilteredCounts,
  updateFilters,
  updateHasCheckpoints,
  updateHasColumns,
  updateHasConfig,
  updateHasRunningExperiment,
  updateHasValidDvcYaml,
  updateRows,
  updateSorts
} = tableDataSlice.actions

export default tableDataSlice.reducer
