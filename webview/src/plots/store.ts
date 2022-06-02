import { configureStore } from '@reduxjs/toolkit'
import checkpointPlotsReducer from './components/checkpointPlots/checkpointPlotsSlice'
import comparisonTableReducer from './components/comparisonTable/comparisonTableSlice'
import templatePlotsReducer from './components/templatePlots/templatePlotsSlice'
import webviewReducer from './components/webviewSlice'

export const store = configureStore({
  reducer: {
    checkpoint: checkpointPlotsReducer,
    comparison: comparisonTableReducer,
    template: templatePlotsReducer,
    webview: webviewReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
