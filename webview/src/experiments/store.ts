import { configureStore } from '@reduxjs/toolkit'
import tableDataReducer from './components/table/tableDataSlice'
import headersReducer from './components/table/headersSlice'
import headerDropTargetReducer from './components/table/headerDropTargetSlice'
import dragAndDropReducer from '../shared/components/dragDrop/dragDropSlice'

export const experimentsReducers = {
  dragAndDrop: dragAndDropReducer,
  headerDropTarget: headerDropTargetReducer,
  headers: headersReducer,
  tableData: tableDataReducer
}

export const experimentsStore = configureStore({
  reducer: experimentsReducers
})

export type ExperimentsState = ReturnType<typeof experimentsStore.getState>
export type ExperimentsDispatch = typeof experimentsStore.dispatch
