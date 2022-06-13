import { createSlice, PayloadAction } from '@reduxjs/toolkit'
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
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.webview) {
          return { ...initialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState,
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
    },
    updateHasPlots: (state, action: PayloadAction<boolean>) => {
      state.hasPlots = action.payload
    },
    updateHasSelectedPlots: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedPlots = action.payload
    },
    updateHasSelectedRevisions: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedRevisions = action.payload
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
