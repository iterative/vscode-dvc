import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'

type ZoomedInPlotState = {
  plot: string
  id: string
  refresh?: boolean
}
export interface WebviewState {
  hasData: boolean
  hasPlots: boolean
  hasSelectedPlots: boolean
  hasSelectedRevisions: boolean
  zoomedInPlot: ZoomedInPlotState | undefined
}

const initialState: WebviewState = {
  hasData: false,
  hasPlots: false,
  hasSelectedPlots: false,
  hasSelectedRevisions: false,
  zoomedInPlot: undefined
}

export const webviewSlice = createSlice({
  name: 'webview',
  initialState,
  reducers: {
    initialize: state => {
      state.hasData = true
    },
    updateHasPlots: (state, action: PayloadAction<boolean>) => {
      state.hasPlots = action.payload
    },
    updateHasSelectedPlots: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedPlots = action.payload
    },
    updateHasSelectedRevisions: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedRevisions = action.payload
    },
    setZoomedInPlot: (
      state,
      action: PayloadAction<ZoomedInPlotState | undefined>
    ) => {
      if (!action.payload) {
        state.zoomedInPlot = initialState.zoomedInPlot
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
    }
  }
})

export const {
  initialize,
  updateHasPlots,
  updateHasSelectedPlots,
  updateHasSelectedRevisions,
  setZoomedInPlot
} = webviewSlice.actions

export default webviewSlice.reducer
