import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Revision } from 'dvc/src/plots/webview/contract'
import { clearData } from '../actions'
import { ReducerName } from '../constants'

type ZoomedInPlotState = {
  plot: string
  id: string
  refresh?: boolean
}
export interface WebviewState {
  hasData: boolean
  hasPlots: boolean
  hasSelectedPlots: boolean
  selectedRevisions: Revision[]
  zoomedInPlot: ZoomedInPlotState | undefined
}

export const webviewInitialState: WebviewState = {
  hasData: false,
  hasPlots: false,
  hasSelectedPlots: false,
  selectedRevisions: [],
  zoomedInPlot: undefined
}

export const webviewSlice = createSlice({
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.webview) {
          return { ...webviewInitialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState: webviewInitialState,
  name: ReducerName.webview,
  reducers: {
    initialize: state => {
      state.hasData = true
    },
    setZoomedInPlot: (
      state,
      action: PayloadAction<ZoomedInPlotState | undefined>
    ) => {
      if (!action.payload) {
        state.zoomedInPlot = webviewInitialState.zoomedInPlot
        return
      }

      if (
        action.payload.id === state.zoomedInPlot?.id ||
        !action.payload.refresh
      ) {
        state.zoomedInPlot = {
          id: action.payload.id,
          plot: action.payload.plot
        }
      }
    },
    updateHasPlots: (state, action: PayloadAction<boolean>) => {
      state.hasPlots = action.payload
    },
    updateHasSelectedPlots: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedPlots = action.payload
    },
    updateSelectedRevisions: (
      state,
      action: PayloadAction<Revision[] | undefined>
    ) => {
      state.selectedRevisions = action.payload || []
    }
  }
})

export const {
  initialize,
  updateHasPlots,
  updateHasSelectedPlots,
  updateSelectedRevisions,
  setZoomedInPlot
} = webviewSlice.actions

export default webviewSlice.reducer
