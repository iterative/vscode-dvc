import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotsComparisonData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'

export interface ComparisonTableState extends PlotsComparisonData {
  isCollapsed: boolean
  hasData: boolean
}

const initialState: ComparisonTableState = {
  sectionName: DEFAULT_SECTION_NAMES[Section.COMPARISON_TABLE],
  size: DEFAULT_SECTION_SIZES[Section.COMPARISON_TABLE],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.COMPARISON_TABLE],
  plots: [],
  revisions: [],
  hasData: false
}

export const comparisonTableSlide = createSlice({
  name: 'comparisonTable',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<PlotsComparisonData>) => {
      state.plots = action.payload.plots
      state.revisions = action.payload.revisions
      state.size = action.payload.size
      state.sectionName = action.payload.sectionName
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

export const { update, setCollapsed, changeSize } = comparisonTableSlide.actions

export default comparisonTableSlide.reducer
