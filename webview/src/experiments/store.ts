import { configureStore } from '@reduxjs/toolkit'
import dragAndDropReducer from '../shared/components/dragDrop/dragDropSlice'

export const experimentsReducers = {
  dragAndDrop: dragAndDropReducer
}

export const experimentsStore = configureStore({
  reducer: experimentsReducers
})

export type ExperimentsState = ReturnType<typeof experimentsStore.getState>
export type ExperimentsDispatch = typeof experimentsStore.dispatch
