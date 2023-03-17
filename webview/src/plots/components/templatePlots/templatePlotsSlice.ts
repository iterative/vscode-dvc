import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_HEIGHT,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
  PlotHeight,
  PlotsSection,
  TemplatePlotGroup,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import { addPlotsWithSnapshots, removePlots } from '../plotDataStore'

export type PlotGroup = { group: TemplatePlotGroup; entries: string[] }
export interface TemplatePlotsState extends Omit<TemplatePlotsData, 'plots'> {
  isCollapsed: boolean
  hasData: boolean
  plotsSnapshots: { [key: string]: string }
  sections: PlotGroup[]
  disabledDragPlotIds: string[]
}

export const templatePlotsInitialState: TemplatePlotsState = {
  disabledDragPlotIds: [],
  hasData: false,
  height: DEFAULT_HEIGHT[PlotsSection.TEMPLATE_PLOTS],
  isCollapsed: DEFAULT_SECTION_COLLAPSED[PlotsSection.TEMPLATE_PLOTS],
  nbItemsPerRow:
    DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH[PlotsSection.TEMPLATE_PLOTS],
  plotsSnapshots: {},
  sections: []
}

export const templatePlotsSlice = createSlice({
  initialState: templatePlotsInitialState,
  name: 'template',
  reducers: {
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeSize: (
      state,
      action: PayloadAction<{
        nbItemsPerRowOrWidth: number
        height: PlotHeight
      }>
    ) => {
      state.nbItemsPerRow = action.payload.nbItemsPerRowOrWidth
      state.height = action.payload.height
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<TemplatePlotsData>) => {
      if (!action.payload) {
        return templatePlotsInitialState
      }

      const plotSections = action.payload.plots?.map(section => ({
        entries: section.entries.map(entry => entry.id),
        group: section.group
      }))

      const plots = action.payload.plots?.flatMap(section => section.entries)
      const plotsIds = plots?.map(plot => plot.id) || []
      const snapShots = addPlotsWithSnapshots(
        plots,
        PlotsSection.TEMPLATE_PLOTS
      )
      removePlots(plotsIds, PlotsSection.TEMPLATE_PLOTS)

      return {
        ...state,
        hasData: !!action.payload,
        nbItemsPerRow: action.payload.nbItemsPerRow,
        plotsSnapshots: snapShots,
        sections:
          JSON.stringify(plotSections) === JSON.stringify(state.sections)
            ? state.sections
            : plotSections
      }
    },
    updateSections: (state, action: PayloadAction<PlotGroup[]>) => {
      return {
        ...state,
        sections: action.payload
      }
    }
  }
})

export const {
  update,
  setCollapsed,
  changeSize,
  changeDisabledDragIds,
  updateSections
} = templatePlotsSlice.actions

export default templatePlotsSlice.reducer
