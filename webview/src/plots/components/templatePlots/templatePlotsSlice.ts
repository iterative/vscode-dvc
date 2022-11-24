import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  Section,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import { plotDataStore } from '../plotDataStore'

export interface TemplatePlotsState extends Omit<TemplatePlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  plotsSnapshot: string
  disabledDragPlotIds: string[]
}

export const templatePlotsInitialState: TemplatePlotsState = {
  disabledDragPlotIds: [],
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  plotsSnapshot: '',
  size: DEFAULT_SECTION_SIZES[Section.TEMPLATE_PLOTS]
}

export const templatePlotsSlice = createSlice({
  initialState: templatePlotsInitialState,
  name: 'template',
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
    update: (state, action: PayloadAction<TemplatePlotsData>) => {
      plotDataStore.template = action.payload?.plots
      if (!action.payload) {
        return templatePlotsInitialState
      }

      return {
        ...state,
        hasData: !!action.payload,
        plotsSnapshot: JSON.stringify(action.payload.plots),
        size: Math.abs(action.payload.size)
      }
    }
  }
})

export const { update, setCollapsed, changeSize, changeDisabledDragIds } =
  templatePlotsSlice.actions

export default templatePlotsSlice.reducer
