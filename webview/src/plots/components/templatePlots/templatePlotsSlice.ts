import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import cloneDeep from 'lodash.clonedeep'
import { clearData } from '../../actions'
import { ReducerName } from '../../constants'
import { RootState } from '../../store'

export interface TemplatePlotsState extends TemplatePlotsData {
  isCollapsed: boolean
  hasData: boolean
}

export const templatePlotsInitialState: TemplatePlotsState = {
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  plots: [],
  size: DEFAULT_SECTION_SIZES[Section.TEMPLATE_PLOTS]
}

export const templatePlotsSlice = createSlice({
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.TEMPLATE) {
          return { ...templatePlotsInitialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState: templatePlotsInitialState,
  name: ReducerName.TEMPLATE,

  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<TemplatePlotsData>) => {
      return {
        ...state,
        ...action.payload,
        hasData: !!action.payload
      }
    }
  }
})

export const { update, setCollapsed, changeSize } = templatePlotsSlice.actions

export const getTemplatePlots = createSelector(
  (state: RootState) => state.template.plots,
  plots => cloneDeep(plots)
)

export default templatePlotsSlice.reducer
