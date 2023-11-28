import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_HEIGHT,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
  PlotsComparisonData,
  PlotsSection
} from 'dvc/src/plots/webview/contract'

export interface ComparisonTableState extends PlotsComparisonData {
  isCollapsed: boolean
  hasData: boolean
  rowHeight: number
  disabledDragPlotIds: string[]
  shouldShowTooManyPlotsMessage: boolean
  isInDragAndDropMode: boolean
}

export const DEFAULT_ROW_HEIGHT = 200

export const comparisonTableInitialState: ComparisonTableState = {
  disabledDragPlotIds: [],
  hasData: false,
  height: DEFAULT_HEIGHT[PlotsSection.COMPARISON_TABLE],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[PlotsSection.COMPARISON_TABLE],
  isInDragAndDropMode: false,
  multiPlotValues: {},
  plots: [],
  revisions: [],
  rowHeight: DEFAULT_ROW_HEIGHT,
  shouldShowTooManyPlotsMessage: false,
  width:
    DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH[PlotsSection.COMPARISON_TABLE]
}

export const comparisonTableSlice = createSlice({
  initialState: comparisonTableInitialState,
  name: 'comparison',
  reducers: {
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeRowHeight: (state, action: PayloadAction<number>) => {
      state.rowHeight = action.payload
    },
    changeSize: (
      state,
      action: PayloadAction<{ nbItemsPerRowOrWidth: number; height: number }>
    ) => {
      state.width = action.payload.nbItemsPerRowOrWidth
    },
    clearState: () => {
      return comparisonTableInitialState
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    toggleDragAndDropMode: (state, action: PayloadAction<boolean>) => {
      state.isInDragAndDropMode = action.payload
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
    },
    updateShouldShowTooManyPlotsMessage: (
      state: { shouldShowTooManyPlotsMessage: boolean },
      action: PayloadAction<boolean>
    ) => {
      state.shouldShowTooManyPlotsMessage = action.payload
    }
  }
})

export const {
  update,
  setCollapsed,
  changeSize,
  changeDisabledDragIds,
  changeRowHeight,
  updateShouldShowTooManyPlotsMessage
  toggleDragAndDropMode,
  clearState
} = comparisonTableSlice.actions

export default comparisonTableSlice.reducer
