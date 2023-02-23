import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  Section,
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
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  plotsSnapshots: {},
  sections: [],
  size: DEFAULT_SECTION_SIZES[Section.TEMPLATE_PLOTS]
}

export const templatePlotsSlice = createSlice({
  initialState: templatePlotsInitialState,
  name: 'template',
  reducers: {
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload
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
      const snapShots = addPlotsWithSnapshots(plots, Section.TEMPLATE_PLOTS)
      removePlots(plotsIds, Section.TEMPLATE_PLOTS)

      return {
        ...state,
        hasData: !!action.payload,
        plotsSnapshots: snapShots,
        sections:
          JSON.stringify(plotSections) === JSON.stringify(state.sections)
            ? state.sections
            : plotSections,
        size: Math.abs(action.payload.size)
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
