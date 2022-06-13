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
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  plots: [],
  sectionName: DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS],
  size: DEFAULT_SECTION_SIZES[Section.TEMPLATE_PLOTS]
}

export const templatePlotsSlice = createSlice({
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.template) {
          return { ...initialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState,
  name: ReducerName.template,

  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<TemplatePlotsData>) => {
      Object.assign(state, action.payload)
      state.hasData = !!action.payload
    }
  }
})

export const { update, setCollapsed, changeSize } = templatePlotsSlice.actions

export default templatePlotsSlice.reducer
