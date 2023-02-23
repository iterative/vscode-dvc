/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Revision } from 'dvc/src/plots/webview/contract'
import { VegaProps } from 'react-vega/lib/Vega'

type ZoomedInPlotState = {
  plot: VegaProps | undefined
  id: string
  refresh?: boolean
}

type SnapPoints = [number, number, number, number]
export interface WebviewState {
  hasData: boolean
  hasPlots: boolean
  hasUnselectedPlots: boolean
  selectedRevisions: Revision[]
  zoomedInPlot: ZoomedInPlotState | undefined
  snapPoints: SnapPoints
}

export const webviewInitialState: WebviewState = {
  hasData: false,
  hasPlots: false,
  hasUnselectedPlots: false,
  selectedRevisions: [],
  snapPoints: [0, 0, 0, 0],
  zoomedInPlot: {
    id: '',
    plot: undefined
  }
}

export const webviewSlice = createSlice({
  initialState: webviewInitialState,
  name: 'webview',
  reducers: {
    initialize: (state: { hasData: boolean }) => {
      state.hasData = true
    },
    setSnapPoints: (
      state: { snapPoints: SnapPoints },
      action: PayloadAction<number>
    ) => {
      // Action payload here is the max size of the plots webview. When changed, we re-calculate the snap points.
      state.snapPoints = [
        action.payload,
        action.payload / 2,
        action.payload / 3,
        action.payload / 4
      ]
    },
    setZoomedInPlot: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: any,
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
    updateHasPlots: (
      state: { hasPlots: boolean },
      action: PayloadAction<boolean>
    ) => {
      state.hasPlots = action.payload
    },
    updateHasUnselectedPlots: (
      state: { hasUnselectedPlots: boolean },
      action: PayloadAction<boolean>
    ) => {
      state.hasUnselectedPlots = action.payload
    },
    updateSelectedRevisions: (
      state: { selectedRevisions: Revision[] },
      action: PayloadAction<Revision[] | undefined>
    ) => {
      state.selectedRevisions = action.payload || []
    }
  }
})

export const {
  initialize,
  updateHasPlots,
  updateHasUnselectedPlots,
  updateSelectedRevisions,
  setZoomedInPlot,
  setSnapPoints
} = webviewSlice.actions

export default webviewSlice.reducer
