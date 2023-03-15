import {
  CheckpointPlotData,
  CustomPlotData,
  PlotsSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'

export type CheckpointPlotsById = { [key: string]: CheckpointPlotData }
export type CustomPlotsById = { [key: string]: CustomPlotData }
export type TemplatePlotsById = { [key: string]: TemplatePlotEntry }

export const plotDataStore = {
  [PlotsSection.CHECKPOINT_PLOTS]: {} as CheckpointPlotsById,
  [PlotsSection.TEMPLATE_PLOTS]: {} as TemplatePlotsById,
  [PlotsSection.COMPARISON_TABLE]: {} as CheckpointPlotsById, // This category is unused but exists only to make typings easier,
  [PlotsSection.CUSTOM_PLOTS]: {} as CustomPlotsById
}

export const addPlotsWithSnapshots = (
  plots: (CheckpointPlotData | TemplatePlotEntry | CustomPlotData)[],
  section: PlotsSection
) => {
  const snapShots: { [key: string]: string } = {}
  for (const plot of plots || []) {
    plotDataStore[section][plot.id] = plot
    snapShots[plot.id] = JSON.stringify(plot)
  }
  return snapShots
}

export const removePlots = (currentIds: string[], section: PlotsSection) => {
  for (const plotId of Object.keys(plotDataStore[section])) {
    if (!currentIds.includes(plotId)) {
      delete plotDataStore[section][plotId]
    }
  }
}
