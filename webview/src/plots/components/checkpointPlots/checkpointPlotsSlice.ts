import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CheckpointPlotsData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { ReducerName } from '../../../shared/constants'
import { clearData } from '../../../shared/actions'
import {
  addCheckpointPlotsWithSnapshots,
  removeCheckpointPlots
} from '../plotDataStore'
export interface CheckpointPlotsState
  extends Omit<CheckpointPlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  plotsIds: string[]
  plotsSnapshots: { [key: string]: string }
}

export const checkpointPlotsInitialState: CheckpointPlotsState = {
  colors: { domain: [], range: [] },
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.CHECKPOINT_PLOTS],
  plotsIds: [],
  plotsSnapshots: {},
  selectedMetrics: [],
  size: DEFAULT_SECTION_SIZES[Section.CHECKPOINT_PLOTS]
}

export const checkpointPlotsSlice = createSlice({
  extraReducers: builder => {
    builder.addCase(clearData, (_, action) => {
      if (!action.payload || action.payload === ReducerName.CHECKPOINT) {
        return { ...checkpointPlotsInitialState }
      }
    })
  },
  initialState: checkpointPlotsInitialState,
  name: ReducerName.CHECKPOINT,
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },

    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<CheckpointPlotsData>) => {
      if (action.payload) {
        const { plots, ...statePayload } = action.payload
        const plotsIds = plots?.map(plot => plot.title) || []
        const snapShots = addCheckpointPlotsWithSnapshots(plots)
        removeCheckpointPlots(plotsIds)
        return {
          ...state,
          ...statePayload,
          hasData: !!action.payload,
          plotsIds: plots?.map(plot => plot.title) || [],
          plotsSnapshots: snapShots
        }
      }
      return checkpointPlotsInitialState
    }
  }
})

export const { update, setCollapsed, changeSize } = checkpointPlotsSlice.actions

export default checkpointPlotsSlice.reducer
