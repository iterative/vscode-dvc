import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CheckpointPlotsData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
  Section
} from 'dvc/src/plots/webview/contract'
import { addPlotsWithSnapshots, removePlots } from '../plotDataStore'

export interface CheckpointPlotsState
  extends Omit<CheckpointPlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  plotsIds: string[]
  plotsSnapshots: { [key: string]: string }
  disabledDragPlotIds: string[]
}

export const checkpointPlotsInitialState: CheckpointPlotsState = {
  colors: { domain: [], range: [] },
  disabledDragPlotIds: [],
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.CHECKPOINT_PLOTS],
  nbItemsPerRow: DEFAULT_SECTION_NB_ITEMS_PER_ROW[Section.CHECKPOINT_PLOTS],
  plotsIds: [],
  plotsSnapshots: {},
  selectedMetrics: []
}

export const checkpointPlotsSlice = createSlice({
  initialState: checkpointPlotsInitialState,
  name: 'checkpoint',
  reducers: {
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeSize: (state, action: PayloadAction<number>) => {
      state.nbItemsPerRow = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<CheckpointPlotsData>) => {
      if (!action.payload) {
        return checkpointPlotsInitialState
      }
      const { plots, ...statePayload } = action.payload
      const plotsIds = plots?.map(plot => plot.id) || []
      const snapShots = addPlotsWithSnapshots(plots, Section.CHECKPOINT_PLOTS)
      removePlots(plotsIds, Section.CHECKPOINT_PLOTS)
      return {
        ...state,
        ...statePayload,
        hasData: !!action.payload,
        plotsIds: plots?.map(plot => plot.id) || [],
        plotsSnapshots: snapShots
      }
    }
  }
})

export const { update, setCollapsed, changeSize, changeDisabledDragIds } =
  checkpointPlotsSlice.actions

export default checkpointPlotsSlice.reducer
