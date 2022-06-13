import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotsComparisonData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { clearData } from '../../actions'
import { ReducerName } from '../../constants'

export interface ComparisonTableState extends PlotsComparisonData {
  isCollapsed: boolean
  hasData: boolean
}

const initialState: ComparisonTableState = {
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.COMPARISON_TABLE],
  plots: [],
  revisions: [],
  sectionName: DEFAULT_SECTION_NAMES[Section.COMPARISON_TABLE],
  size: DEFAULT_SECTION_SIZES[Section.COMPARISON_TABLE]
}

export const comparisonTableSlice = createSlice({
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.comparison) {
          return { ...initialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState,
  name: ReducerName.comparison,
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<PlotsComparisonData>) => {
      Object.assign(state, action.payload)
      state.hasData = !!action.payload
    }
  }
})

export const { update, setCollapsed, changeSize } = comparisonTableSlice.actions

export default comparisonTableSlice.reducer
