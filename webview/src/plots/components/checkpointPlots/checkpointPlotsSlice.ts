import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CheckpointPlotsData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'

export interface CheckpointPlotsState extends CheckpointPlotsData {
  isCollapsed: boolean
  hasData: boolean
}

const initialState: CheckpointPlotsState = {
  sectionName: DEFAULT_SECTION_NAMES[Section.CHECKPOINT_PLOTS],
  size: DEFAULT_SECTION_SIZES[Section.CHECKPOINT_PLOTS],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.CHECKPOINT_PLOTS],
  plots: [],
  colors: { domain: [], range: [] },
  selectedMetrics: [],
  hasData: false
}

export const checkpointPlotsSlice = createSlice({
  name: 'checkpointPlots',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<CheckpointPlotsData>) => {
      Object.assign(state, action.payload)
      state.hasData = !!action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    }
  }
})

export const { update, setCollapsed, changeSize } = checkpointPlotsSlice.actions

export default checkpointPlotsSlice.reducer
