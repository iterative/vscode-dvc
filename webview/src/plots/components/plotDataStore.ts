import {
  CheckpointPlotData,
  CustomPlotData,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'

export type CheckpointPlotsById = {
  [key: string]: CheckpointPlotData
}

export type CustomPlotsById = {
  [key: string]: CustomPlotData
}

export const plotDataStore = {
  checkpoint: {} as CheckpointPlotsById,
  custom: {} as CustomPlotsById,
  template: [] as TemplatePlotSection[]
}

export const addCheckpointPlotsWithSnapshots = (
  plots: CheckpointPlotData[]
) => {
  const snapShots: { [key: string]: string } = {}
  for (const plot of plots || []) {
    plotDataStore.checkpoint[plot.id] = plot
    snapShots[plot.id] = JSON.stringify(plot)
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

export const addCustomPlotsWithSnapshots = (plots: CustomPlotData[]) => {
  const snapShots: { [key: string]: string } = {}
  for (const plot of plots || []) {
    plotDataStore.custom[plot.id] = plot
    snapShots[plot.id] = JSON.stringify(plot)
  }
  return snapShots
}

export const removeCustomPlots = (currentIds: string[]) => {
  for (const plotId of Object.keys(plotDataStore.custom)) {
    if (!currentIds.includes(plotId)) {
      delete plotDataStore.custom[plotId]
    }
  }
}
