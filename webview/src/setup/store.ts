import { configureStore } from '@reduxjs/toolkit'
import setupDataReducer from './state/setupDataSlice'

export const setupReducers = {
  setupData: setupDataReducer
}

export const setupStore = configureStore({
  reducer: setupReducers
})

export type SetupState = ReturnType<typeof setupStore.getState>
export type SetupDispatch = typeof setupStore.dispatch
