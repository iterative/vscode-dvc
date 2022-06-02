import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'

type ZoomedInPlotState = {
  plot: VegaLiteProps
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
      if (!action.payload?.refresh) {
        state.zoomedInPlot = undefined // Don't want to keep anything extra from old zoomed in plot as replacing the whole thing is not allowed by Immer (only assign)
        Object.assign(state.zoomedInPlot, action.payload)
        return
      }

      if (action.payload.id === state.zoomedInPlot?.id) {
        Object.assign(state.zoomedInPlot, action.payload)
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
