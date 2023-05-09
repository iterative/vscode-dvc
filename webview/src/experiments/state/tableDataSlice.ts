import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import {
  Column,
  Experiment,
  TableData
} from 'dvc/src/experiments/webview/contract'
import { keepEqualOldReferencesInArray } from '../../util/array'
import { keepReferenceIfEqual } from '../../util/objects'

export interface TableDataState extends TableData {
  hasData?: boolean
  branches: string[]
}

export const tableDataInitialState: TableDataState = {
  branches: ['current'],
  changes: [],
  columnOrder: [],
  columnWidths: {},
  columns: [],
  filteredCount: 0,
  filters: [],
  hasBranchesToSelect: true,
  hasCheckpoints: false,
  hasColumns: false,
  hasConfig: false,
  hasData: false,
  hasMoreCommits: false,
  hasRunningWorkspaceExperiment: false,
  hasValidDvcYaml: true,
  isBranchesView: false,
  isShowingMoreCommits: true,
  rows: [],
  selectedForPlotsCount: 0,
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
    updateFilteredCount: (state, action: PayloadAction<number>) => {
      state.filteredCount = action.payload
    },
    updateFilters: (state, action: PayloadAction<string[]>) => {
      state.filters = action.payload
    },
    updateHasBranchesToSelect: (state, action: PayloadAction<boolean>) => {
      state.hasBranchesToSelect = action.payload
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
    updateHasMoreCommits: (state, action: PayloadAction<boolean>) => {
      state.hasMoreCommits = action.payload
    },
    updateHasRunningWorkspaceExperiment: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.hasRunningWorkspaceExperiment = action.payload
    },
    updateHasValidDvcYaml: (state, action: PayloadAction<boolean>) => {
      state.hasValidDvcYaml = action.payload
    },
    updateIsBranchesView: (state, action: PayloadAction<boolean>) => {
      state.isBranchesView = action.payload
    },
    updateIsShowingMoreCommits: (state, action: PayloadAction<boolean>) => {
      state.isShowingMoreCommits = action.payload
    },
    updateRows: (state, action: PayloadAction<Experiment[]>) => {
      state.rows = keepEqualOldReferencesInArray(
        state.rows,
        action.payload
      ) as Experiment[]
      state.branches = [
        ...new Set(state.rows.map(row => row.branch))
      ] as string[]
    },
    updateSelectedForPlotsCount: (state, action: PayloadAction<number>) => {
      state.selectedForPlotsCount = action.payload
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
  updateFilteredCount,
  updateFilters,
  updateHasBranchesToSelect,
  updateHasCheckpoints,
  updateHasColumns,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateHasValidDvcYaml,
  updateIsBranchesView,
  updateIsShowingMoreCommits,
  updateRows,
  updateSelectedForPlotsCount,
  updateSorts
} = tableDataSlice.actions

export default tableDataSlice.reducer
