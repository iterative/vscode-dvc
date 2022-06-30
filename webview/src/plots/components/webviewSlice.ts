import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Revision } from 'dvc/src/plots/webview/contract'
import { VegaProps } from 'react-vega/lib/Vega'

type ZoomedInPlotState = {
  plot: VegaProps | undefined
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
  zoomedInPlot: {
    id: '',
    plot: undefined
  }
}

export const webviewSlice = createSlice({
  initialState: webviewInitialState,
  name: 'webview',
  reducers: {
    initialize: state => {
      state.hasData = true
    },
    setZoomedInPlot: (
      state,
      action: PayloadAction<ZoomedInPlotState | undefined>
    ) => {
      if (!action.payload) {
        Object.assign(state.zoomedInPlot, webviewInitialState.zoomedInPlot)
        return
      }

      if (
        action.payload.id === state.zoomedInPlot?.id ||
        !action.payload.refresh
      ) {
        Object.assign(state.zoomedInPlot, action.payload)
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
