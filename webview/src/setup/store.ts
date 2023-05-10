import { configureStore } from '@reduxjs/toolkit'
import dvcReducer from './state/dvcSlice'
import studioReducer from './state/studioSlice'
import experimentsReducer from './state/experimentsSlice'
import webviewReducer from './state/webviewSlice'

export const setupReducers = {
  dvc: dvcReducer,
  experiments: experimentsReducer,
  studio: studioReducer,
  webview: webviewReducer
}

export const setupStore = configureStore({
  reducer: setupReducers
})

export type SetupState = ReturnType<typeof setupStore.getState>
export type SetupDispatch = typeof setupStore.dispatch
