import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CheckpointPlotData,
  CheckpointPlotsData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { clearData } from '../../actions'
import { ReducerName } from '../../constants'

type PlotsById = { [key: string]: CheckpointPlotData }
export interface CheckpointPlotsState extends CheckpointPlotsData {
  isCollapsed: boolean
  hasData: boolean
  plotsIds: string[]
  plotsById: PlotsById
}

export const checkpointPlotsInitialState: CheckpointPlotsState = {
  colors: { domain: [], range: [] },
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.CHECKPOINT_PLOTS],
  plots: [],
  plotsById: {},
  plotsIds: [],
  selectedMetrics: [],
  size: DEFAULT_SECTION_SIZES[Section.CHECKPOINT_PLOTS]
}

export const checkpointPlotsSlice = createSlice({
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.checkpoint) {
          return { ...checkpointPlotsInitialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState: checkpointPlotsInitialState,
  name: ReducerName.checkpoint,
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },

    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<CheckpointPlotsData>) => {
      Object.assign(state, action.payload)
      state.plotsIds = action.payload.plots?.map(plot => plot.title) || []
      state.plotsById = {}
      for (const plot of action.payload.plots) {
        state.plotsById[plot.title] = plot
      }
      console.log(state.plotsById)

      state.hasData = !!action.payload
    }
  }
})

export const { update, setCollapsed, changeSize } = checkpointPlotsSlice.actions

export default checkpointPlotsSlice.reducer
