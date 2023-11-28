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
  isInDragAndDropMode: boolean
}

export const customPlotsInitialState: CustomPlotsState = {
  hasAddedPlots: false,
  hasData: false,
  hasItems: false,
  hasUnfilteredExperiments: false,
  height: DEFAULT_HEIGHT[PlotsSection.CUSTOM_PLOTS],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[PlotsSection.CUSTOM_PLOTS],
  isInDragAndDropMode: false,
  nbItemsPerRow:
    DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH[PlotsSection.CUSTOM_PLOTS],
  plotsIds: [],
  plotsSnapshots: {}
}

export const customPlotsSlice = createSlice({
  initialState: customPlotsInitialState,
  name: 'custom',
  reducers: {
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
    clearState: () => {
      removePlots([], PlotsSection.TEMPLATE_PLOTS)
      return customPlotsInitialState
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    toggleDragAndDropMode: (state, action: PayloadAction<boolean>) => {
      state.isInDragAndDropMode = action.payload
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

export const {
  update,
  setCollapsed,
  changeSize,
  toggleDragAndDropMode,
  clearState
} = customPlotsSlice.actions

export default customPlotsSlice.reducer
