import { configureStore } from '@reduxjs/toolkit'
import dragAndDropReducer from '../shared/components/dragDrop/dragDropSlice'

export const storeReducers = {
  dragAndDrop: dragAndDropReducer
}

export const store = configureStore({
  reducer: storeReducers
})

export type ExperimentsRootState = ReturnType<typeof store.getState>
export type ExperimentsAppDispatch = typeof store.dispatch
