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
  hasData: false,
  hasRunningExperiment: false,
  rows: [],
  sorts: []
}

export const tableDataSlice = createSlice({
  initialState: tableDataInitialState,
  name: 'tableData',
  reducers: {
    update: (state, action: PayloadAction<TableData>) => {
      if (action.payload) {
        const columns = keepEqualOldReferencesInArray(
          state.columns,
          action.payload.columns
        ) as Column[]
        const rows = keepEqualOldReferencesInArray(
          state.rows,
          action.payload.rows
        ) as Row[]
        const sorts = keepEqualOldReferencesInArray(
          state.sorts,
          action.payload.sorts
        ) as SortDefinition[]
        const columnWidths = keepReferenceIfEqual(
          state.columnWidths,
          action.payload.columnWidths
        ) as Record<string, number>
        const filteredCounts = keepReferenceIfEqual(
          state.filteredCounts,
          action.payload.filteredCounts
        ) as FilteredCounts
        return {
          ...state,
          ...action.payload,
          columnWidths,
          columns,
          filteredCounts,
          hasData: true,
          rows,
          sorts
        }
      }
      return tableDataInitialState
    }
  }
})

export const { update } = tableDataSlice.actions

export default tableDataSlice.reducer
