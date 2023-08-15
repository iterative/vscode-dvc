import { configureStore } from '@reduxjs/toolkit'
import tableDataReducer from './state/tableDataSlice'
import rowSelectionReducer from './state/rowSelectionSlice'
import headersReducer from './state/headersSlice'
import headerDropTargetReducer from './state/headerDropTargetSlice'

export const experimentsReducers = {
  headerDropTarget: headerDropTargetReducer,
  headers: headersReducer,
  rowSelection: rowSelectionReducer,
  tableData: tableDataReducer
}

export const experimentsStore = configureStore({
  reducer: experimentsReducers
})

export type ExperimentsState = ReturnType<typeof experimentsStore.getState>
export type ExperimentsDispatch = typeof experimentsStore.dispatch
