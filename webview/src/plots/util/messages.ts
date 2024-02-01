import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { sendMessage } from '../../shared/vscode'
import { PlotGroup } from '../components/templatePlots/templatePlotsSlice'

export const addPlot = () =>
  sendMessage({
    type: MessageFromWebviewType.ADD_PLOT
  })

export const exportPlotAsSvg = (svg: string) => {
  sendMessage({
    payload: svg,
    type: MessageFromWebviewType.EXPORT_PLOT_AS_SVG
  })
}

export const exportPlotDataAsCsv = (id: string) => {
  sendMessage({
    payload: id,
    type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_CSV
  })
}

export const exportPlotDataAsTsv = (id: string) => {
  sendMessage({
    payload: id,
    type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_TSV
  })
}

export const exportPlotDataAsJson = (id: string) => {
  sendMessage({
    payload: id,
    type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_JSON
  })
}

export const refreshRevisions = () =>
  sendMessage({
    type: MessageFromWebviewType.REFRESH_REVISIONS
  })

export const removeCustomPlots = () => {
  sendMessage({ type: MessageFromWebviewType.REMOVE_CUSTOM_PLOTS })
}

export const removeRevision = (revision: string) => {
  sendMessage({
    payload: revision,
    type: MessageFromWebviewType.TOGGLE_EXPERIMENT
  })
}

export const reorderComparisonPlots = (newOrder: { id: string }[]) =>
  sendMessage({
    payload: newOrder.map(({ id }) => id),
    type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
  })

export const reorderComparisonRows = (order: string[]) =>
  sendMessage({
    payload: order,
    type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS
  })

export const reorderCustomPlots = (order: string[]) =>
  sendMessage({
    payload: order,
    type: MessageFromWebviewType.REORDER_PLOTS_CUSTOM
  })

export const reorderTemplatePlots = (sections: PlotGroup[]) =>
  sendMessage({
    payload: sections.map(section => ({
      group: section.group,
      paths: section.entries
    })),
    type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
  })

export const resizePlots = (
  height: number,
  nbItemsPerRow: number,
  section: PlotsSection
) =>
  sendMessage({
    payload: {
      height,
      nbItemsPerRow,
      section
    },
    type: MessageFromWebviewType.RESIZE_PLOTS
  })

export const selectPlots = () =>
  sendMessage({
    type: MessageFromWebviewType.SELECT_PLOTS
  })

export const selectRevisions = () =>
  sendMessage({
    type: MessageFromWebviewType.SELECT_EXPERIMENTS
  })

export const setComparisonMultiPlotValue = (
  path: string,
  revision: string,
  value: number
) => {
  sendMessage({
    payload: { path, revision, value },
    type: MessageFromWebviewType.SET_COMPARISON_MULTI_PLOT_VALUE
  })
}

export const toggleComparisonClass = (
  path: string,
  label: string,
  selected: boolean
) => {
  sendMessage({
    payload: { label, path, selected },
    type: MessageFromWebviewType.TOGGLE_COMPARISON_CLASS
  })
}

export const togglePlotsSection = (
  sectionKey: PlotsSection,
  sectionCollapsed: boolean
) =>
  sendMessage({
    payload: {
      [sectionKey]: !sectionCollapsed
    },
    type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
  })

export const setSmoothPlotValues = (id: string, value: number) => {
  sendMessage({
    payload: { id, value },
    type: MessageFromWebviewType.SET_SMOOTH_PLOT_VALUE
  })
}

export const zoomPlot = (imagePath?: string) =>
  sendMessage({ payload: imagePath, type: MessageFromWebviewType.ZOOM_PLOT })

export const refreshSection = (section: PlotsSection) =>
  sendMessage({
    payload: section,
    type: MessageFromWebviewType.REFRESH_PLOTS
  })
