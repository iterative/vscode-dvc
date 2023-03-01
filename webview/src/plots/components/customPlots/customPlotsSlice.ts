import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CustomPlotsData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  Section
} from 'dvc/src/plots/webview/contract'
import { addPlotsWithSnapshots, removePlots } from '../plotDataStore'

export interface CustomPlotsState extends Omit<CustomPlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  plotsIds: string[]
  plotsSnapshots: { [key: string]: string }
  disabledDragPlotIds: string[]
}

export const customPlotsInitialState: CustomPlotsState = {
  disabledDragPlotIds: [],
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.CUSTOM_PLOTS],
  plotsIds: [],
  plotsSnapshots: {},
  size: DEFAULT_SECTION_SIZES[Section.CUSTOM_PLOTS]
}

export const customPlotsSlice = createSlice({
  initialState: customPlotsInitialState,
  name: 'custom',
  reducers: {
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<CustomPlotsData>) => {
      if (!action.payload) {
        return customPlotsInitialState
      }
      const { plots, ...statePayload } = action.payload
      const plotsIds = plots?.map(plot => plot.id) || []
      const snapShots = addPlotsWithSnapshots(plots, Section.CUSTOM_PLOTS)
      removePlots(plotsIds, Section.CUSTOM_PLOTS)
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
  customPlotsSlice.actions

export default customPlotsSlice.reducer
