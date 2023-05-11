import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CustomPlotsData,
  DEFAULT_HEIGHT,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
  PlotHeight,
  PlotsSection
} from 'dvc/src/plots/webview/contract'
import { addPlotsWithSnapshots, removePlots } from '../plotDataStore'

export interface CustomPlotsState extends Omit<CustomPlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  hasItems: boolean
  plotsIds: string[]
  plotsSnapshots: { [key: string]: string }
  disabledDragPlotIds: string[]
}

export const customPlotsInitialState: CustomPlotsState = {
  disabledDragPlotIds: [],
  enablePlotCreation: true,
  hasData: false,
  hasItems: false,
  height: DEFAULT_HEIGHT[PlotsSection.CUSTOM_PLOTS],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[PlotsSection.CUSTOM_PLOTS],
  nbItemsPerRow:
    DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH[PlotsSection.CUSTOM_PLOTS],
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
      action: PayloadAction<{
        nbItemsPerRowOrWidth: number
        height: PlotHeight
      }>
    ) => {
      state.nbItemsPerRow = action.payload.nbItemsPerRowOrWidth
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
      const plotsSnapshots = addPlotsWithSnapshots(
        plots,
        PlotsSection.CUSTOM_PLOTS
      )
      removePlots(plotsIds, PlotsSection.CUSTOM_PLOTS)
      return {
        ...state,
        ...statePayload,
        hasData: !!action.payload,
        hasItems: Object.keys(plotsSnapshots).length > 0,
        plotsIds: plots?.map(plot => plot.id) || [],
        plotsSnapshots
      }
    }
  }
})

export const { update, setCollapsed, changeSize, changeDisabledDragIds } =
  customPlotsSlice.actions

export default customPlotsSlice.reducer
