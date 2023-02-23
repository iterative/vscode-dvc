import {
  CheckpointPlotData,
  Section,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'

export type CheckpointPlotsById = { [key: string]: CheckpointPlotData }
export type TemplatePlotsById = { [key: string]: TemplatePlotEntry }

export const plotDataStore = {
  [Section.CHECKPOINT_PLOTS]: {} as CheckpointPlotsById,
  [Section.TEMPLATE_PLOTS]: {} as TemplatePlotsById,
  [Section.COMPARISON_TABLE]: {} as CheckpointPlotsById // This category is unused but exists only to make typings easier
}

export const addPlotsWithSnapshots = (
  plots: (CheckpointPlotData | TemplatePlotEntry)[],
  section: Section
) => {
  const snapShots: { [key: string]: string } = {}
  for (const plot of plots || []) {
    plotDataStore[section][plot.id] = plot
    snapShots[plot.id] = JSON.stringify(plot)
  }
  return snapShots
}

export const removePlots = (currentIds: string[], section: Section) => {
  for (const plotId of Object.keys(plotDataStore[section])) {
    if (!currentIds.includes(plotId)) {
      delete plotDataStore[section][plotId]
    }
  }
}
