import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotsComparisonData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { clearData } from '../../../shared/actions'
import { ReducerName } from '../../../shared/constants'

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
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.COMPARISON) {
          return { ...comparisonTableInitialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState: comparisonTableInitialState,
  name: ReducerName.COMPARISON,
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<PlotsComparisonData>) => {
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
