import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CustomPlotsData,
  DEFAULT_HEIGHT,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
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

const initialColorsState = { domain: [], range: [] }

export const customPlotsInitialState: CustomPlotsState = {
  colors: initialColorsState,
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
    changeSize: (state, action: PayloadAction<number>) => {
      state.nbItemsPerRow = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<CustomPlotsData>) => {
      if (!action.payload) {
        return customPlotsInitialState
      }
      const { plots, colors, ...statePayload } = action.payload
      const plotsIds = plots?.map(plot => plot.id) || []
      const snapShots = addPlotsWithSnapshots(plots, Section.CUSTOM_PLOTS)
      removePlots(plotsIds, Section.CUSTOM_PLOTS)
      return {
        ...state,
        ...statePayload,
        colors: colors || initialColorsState,
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
