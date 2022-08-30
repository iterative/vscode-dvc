import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotsComparisonData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'

export interface ComparisonTableState extends PlotsComparisonData {
  isCollapsed: boolean
  hasData: boolean
}

export const comparisonTableInitialState: ComparisonTableState = {
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.COMPARISON_TABLE],
  plots: [],
  size: DEFAULT_SECTION_SIZES[Section.COMPARISON_TABLE]
}

export const comparisonTableSlice = createSlice({
  initialState: comparisonTableInitialState,
  name: 'comparison',
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<PlotsComparisonData>) => {
      if (!action.payload) {
        return comparisonTableInitialState
      }
      return {
        ...state,
        ...action.payload,
        hasData: !!action.payload
      }
    }
  }
})

export const { update, setCollapsed, changeSize } = comparisonTableSlice.actions

export default comparisonTableSlice.reducer
