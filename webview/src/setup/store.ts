import { configureStore } from '@reduxjs/toolkit'
import dvcReducer from './state/dvcSlice'
import experimentsReducer from './state/experimentsSlice'
import remoteReducer from './state/remoteSlice'
import studioReducer from './state/studioSlice'
import webviewReducer from './state/webviewSlice'

export const setupReducers = {
  dvc: dvcReducer,
  experiments: experimentsReducer,
  remote: remoteReducer,
  studio: studioReducer,
  webview: webviewReducer
}

export const setupStore = configureStore({
  reducer: setupReducers
})

export type SetupState = ReturnType<typeof setupStore.getState>
export type SetupDispatch = typeof setupStore.dispatch
