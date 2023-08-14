import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExecutorStatus } from 'dvc/src/cli/dvc/contract'
import { getCompositeId } from '../util/rows'
import { keepEqualOldReferencesInArray } from '../../util/array'

export type SelectedRow = {
  depth: number
  branch: string | null | undefined
  id: string
  starred: boolean | undefined
  executorStatus: ExecutorStatus | undefined
}

type RowSelectionState = {
  lastSelectedRowId: string | undefined
  rowOrder: SelectedRow[]
  selectedRows: Record<string, SelectedRow | undefined>
}

const initialState: RowSelectionState = {
  lastSelectedRowId: undefined,
  rowOrder: [],
  selectedRows: {}
}

const isInBatch = (
  compositeId: string,
  firstAndLastSelected: Set<string>
): boolean =>
  firstAndLastSelected.delete(compositeId) || firstAndLastSelected.size === 1

export const rowSelectionSlice = createSlice({
  initialState,
  name: 'rowSelection',
  reducers: {
    clearSelectedRows(state) {
      state.selectedRows = {}
      state.lastSelectedRowId = undefined
    },
    selectRowRange(state, action: PayloadAction<SelectedRow>) {
      const selectedId = getCompositeId(
        action.payload.id,
        action.payload.branch
      )
      if (!state.lastSelectedRowId) {
        state.lastSelectedRowId = selectedId
        state.selectedRows[selectedId] = action.payload
        return
      }
      const selectedRowsCopy = { ...state.selectedRows }
      const firstAndLastSelected = new Set<string>([
        selectedId,
        state.lastSelectedRowId
      ])
      for (const row of state.rowOrder) {
        const compositeId = getCompositeId(row.id, row.branch)
        if (firstAndLastSelected.size === 0) {
          break
        }
        if (isInBatch(compositeId, firstAndLastSelected)) {
          selectedRowsCopy[compositeId] = row
        }
      }

      state.selectedRows = selectedRowsCopy
      state.lastSelectedRowId = selectedId
    },
    toggleRowSelected(state, action: PayloadAction<SelectedRow>) {
      const { id, branch } = action.payload
      const compositeId = getCompositeId(id, branch)

      const selected = !!state.selectedRows[compositeId]

      state.selectedRows = {
        ...state.selectedRows,
        [compositeId]: selected ? undefined : action.payload
      }

      state.lastSelectedRowId = selected ? undefined : compositeId
    },
    updateRowOrder(state, action: PayloadAction<SelectedRow[]>) {
      const newOrder = action.payload
      state.rowOrder = keepEqualOldReferencesInArray(
        state.rowOrder,
        newOrder
      ) as SelectedRow[]
    }
  }
})

export const {
  clearSelectedRows,
  selectRowRange,
  toggleRowSelected,
  updateRowOrder
} = rowSelectionSlice.actions

export default rowSelectionSlice.reducer
