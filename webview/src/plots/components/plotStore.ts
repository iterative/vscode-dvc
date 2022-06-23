import {
  CheckpointPlotData,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'

type CheckpointPlotsById = { [key: string]: CheckpointPlotData }

export const plotStore = {
  checkpoint: {} as CheckpointPlotsById,
  template: [] as TemplatePlotSection[]
}

export const addCheckpointPlotsWithSnapshots = (
  plots: CheckpointPlotData[]
) => {
  const snapShots: { [key: string]: string } = {}
  for (const plot of plots || []) {
    plotStore.checkpoint[plot.title] = plot
    snapShots[plot.title] = JSON.stringify(plot)
  }
  return snapShots
}

export const removeCheckpointPlots = (currentIds: string[]) => {
  for (const plotId of Object.keys(plotStore.checkpoint)) {
    if (!currentIds.includes(plotId)) {
      delete plotStore.checkpoint[plotId]
    }
  }
}
