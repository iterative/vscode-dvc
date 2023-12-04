/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Revision } from 'dvc/src/plots/webview/contract'

type ZoomedInPlotState = {
  id: string
  isTemplatePlot: boolean
  openActionsMenu?: boolean
}
export interface WebviewState {
  cliError: string | undefined
  hasData: boolean
  hasPlots: boolean
  hasUnselectedPlots: boolean
  selectedRevisions: Revision[]
  zoomedInPlot: ZoomedInPlotState | undefined
  maxNbPlotsPerRow: number
}

export const webviewInitialState: WebviewState = {
  cliError: undefined,
  hasData: false,
  hasPlots: false,
  hasUnselectedPlots: false,
  maxNbPlotsPerRow: 4,
  selectedRevisions: [],
  zoomedInPlot: undefined
}

export const webviewSlice = createSlice({
  initialState: webviewInitialState,
  name: 'webview',
  reducers: {
    initialize: (state: { hasData: boolean }) => {
      state.hasData = true
    },
    setMaxNbPlotsPerRow: (
      state: { maxNbPlotsPerRow: number },
      action: PayloadAction<number>
    ) => {
      // Action payload here is the max width of the plots webview. When changed, we re-calculate the max number of plots per row
      const maxWidth = action.payload
      state.maxNbPlotsPerRow = Math.floor(maxWidth / 300)
    },
    setZoomedInPlot: (
      state: { zoomedInPlot: ZoomedInPlotState | undefined },
      action: PayloadAction<ZoomedInPlotState | undefined>
    ) => {
      state.zoomedInPlot = action.payload
    },
    updateCliError: (
      state: { cliError: string | undefined },
      action: PayloadAction<string | undefined | null>
    ) => {
      if (action.payload === undefined) {
        return
      }
      if (action.payload === null) {
        state.cliError = undefined
        return
      }
      state.cliError = action.payload
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
  updateCliError,
  updateHasPlots,
  updateHasUnselectedPlots,
  updateSelectedRevisions,
  setZoomedInPlot,
  setMaxNbPlotsPerRow
} = webviewSlice.actions

export default webviewSlice.reducer
