import {
  CheckpointPlotData,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'

export type CheckpointPlotsById = { [key: string]: CheckpointPlotData }

export const plotDataStore = {
  checkpoint: {} as CheckpointPlotsById,
  template: [] as TemplatePlotSection[]
}

export const addCheckpointPlotsWithSnapshots = (
  plots: CheckpointPlotData[]
) => {
  const snapShots: { [key: string]: string } = {}
  for (const plot of plots || []) {
    plotDataStore.checkpoint[plot.title] = plot
    snapShots[plot.title] = JSON.stringify(plot)
  }
  return snapShots
}

export const removeCheckpointPlots = (currentIds: string[]) => {
  for (const plotId of Object.keys(plotDataStore.checkpoint)) {
    if (!currentIds.includes(plotId)) {
      delete plotDataStore.checkpoint[plotId]
    }
  }
}
