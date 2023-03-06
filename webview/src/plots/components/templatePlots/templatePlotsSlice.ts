import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
  PlotAspectRatio,
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
  aspectRatio: DEFAULT_ASPECT_RATIO[Section.TEMPLATE_PLOTS],
  disabledDragPlotIds: [],
  hasData: false,
  isCollapsed: DEFAULT_SECTION_COLLAPSED[Section.TEMPLATE_PLOTS],
  nbItemsPerRow: DEFAULT_SECTION_NB_ITEMS_PER_ROW[Section.TEMPLATE_PLOTS],
  plotsSnapshots: {},
  sections: []
}

export const templatePlotsSlice = createSlice({
  initialState: templatePlotsInitialState,
  name: 'template',
  reducers: {
    changeAspectRatio: (state, action: PayloadAction<PlotAspectRatio>) => {
      state.aspectRatio = action.payload
    },
    changeDisabledDragIds: (state, action: PayloadAction<string[]>) => {
      state.disabledDragPlotIds = action.payload
    },
    changeSize: (state, action: PayloadAction<number>) => {
      state.nbItemsPerRow = action.payload
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
        aspectRatio: action.payload.aspectRatio,
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
  changeAspectRatio,
  changeSize,
  changeDisabledDragIds,
  updateSections
} = templatePlotsSlice.actions

export default templatePlotsSlice.reducer
