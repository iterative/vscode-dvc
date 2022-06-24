import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import { plotDataStore } from '../plotDataStore'

export interface TemplatePlotsState extends Omit<TemplatePlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  plotsSnapshot: string
}

export const templatePlotsInitialState: TemplatePlotsState = {
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  plotsSnapshot: '',
  size: DEFAULT_SECTION_SIZES[Section.TEMPLATE_PLOTS]
}

export const templatePlotsSlice = createSlice({
  initialState: templatePlotsInitialState,
  name: 'template',
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
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
        size: action.payload.size
      }
    }
  }
})

export const { update, setCollapsed, changeSize } = templatePlotsSlice.actions

export default templatePlotsSlice.reducer
