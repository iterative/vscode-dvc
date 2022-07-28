import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TableData } from 'dvc/src/experiments/webview/contract'

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
        return {
          ...state,
          ...action.payload,
          hasData: true
        }
      }
      return tableDataInitialState
    }
  }
})

export const { update } = tableDataSlice.actions

export default tableDataSlice.reducer
