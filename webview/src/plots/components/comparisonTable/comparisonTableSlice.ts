import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
  PlotAspectRatio,
  PlotsComparisonData,
  Section
} from 'dvc/src/plots/webview/contract'

export interface ComparisonTableState extends PlotsComparisonData {
  isCollapsed: boolean
  hasData: boolean
  rowHeight: number
}

export const DEFAULT_ROW_HEIGHT = 200

export const comparisonTableInitialState: ComparisonTableState = {
  aspectRatio: DEFAULT_ASPECT_RATIO[Section.COMPARISON_TABLE],
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.COMPARISON_TABLE],
  nbItemsPerRow: DEFAULT_SECTION_NB_ITEMS_PER_ROW[Section.COMPARISON_TABLE],
  plots: [],
  revisions: [],
  rowHeight: DEFAULT_ROW_HEIGHT
}

export const comparisonTableSlice = createSlice({
  initialState: comparisonTableInitialState,
  name: 'comparison',
  reducers: {
    changeAspectRatio: (state, action: PayloadAction<PlotAspectRatio>) => {
      state.aspectRatio = action.payload
    },
    changeRowHeight: (state, action: PayloadAction<number>) => {
      state.rowHeight = action.payload
    },
    changeSize: (state, action: PayloadAction<number>) => {
      state.nbItemsPerRow = action.payload
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

export const {
  update,
  setCollapsed,
  changeSize,
  changeRowHeight,
  changeAspectRatio
} = comparisonTableSlice.actions

export default comparisonTableSlice.reducer
