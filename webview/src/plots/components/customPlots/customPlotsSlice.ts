import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CustomPlotsData,
  DEFAULT_HEIGHT,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
  PlotHeight,
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
  height: DEFAULT_HEIGHT[Section.CUSTOM_PLOTS],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.CUSTOM_PLOTS],
  nbItemsPerRow: DEFAULT_SECTION_NB_ITEMS_PER_ROW[Section.CUSTOM_PLOTS],
  plotsIds: [],
  plotsSnapshots: {}
}

export const customPlotsSlice = createSlice({
  initialState: customPlotsInitialState,
  name: 'custom',
  reducers: {
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeSize: (
      state,
      action: PayloadAction<{ nbItemsPerRow: number; height: PlotHeight }>
    ) => {
      state.nbItemsPerRow = action.payload.nbItemsPerRow
      state.height = action.payload.height
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
