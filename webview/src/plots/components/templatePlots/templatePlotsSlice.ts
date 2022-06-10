import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import { clearData } from '../../actions'
import { ReducerName } from '../../constants'

export interface TemplatePlotsState extends TemplatePlotsData {
  isCollapsed: boolean
  hasData: boolean
}

const initialState: TemplatePlotsState = {
  plots: [],
  sectionName: DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS],
  size: DEFAULT_SECTION_SIZES[Section.TEMPLATE_PLOTS],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  hasData: false
}

export const templatePlotsSlice = createSlice({
  name: ReducerName.template,
  initialState,
  reducers: {
    update: (state, action: PayloadAction<TemplatePlotsData>) => {
      Object.assign(state, action.payload)
      state.hasData = !!action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(clearData, (state, action) => {
        if (!action.payload || action.payload === ReducerName.template) {
          return { ...initialState }
        }
      })
      .addDefaultCase(() => {})
  }
})

export const { update, setCollapsed, changeSize } = templatePlotsSlice.actions

export default templatePlotsSlice.reducer
