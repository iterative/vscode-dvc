import omit from 'lodash.omit'
import { VisualizationSpec } from 'react-vega'
import {
  LivePlotValues,
  LivePlotData,
  isImagePlot,
  ImagePlot,
  VegaPlot
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsOutput,
  PlotsOutput,
  Value,
  ValueTree
} from '../../cli/reader'
import { reduceMetricsAndParams } from '../../experiments/metricsAndParams/reduce'
import {
  decodeMetricOrParam,
  joinMetricOrParamFilePath
} from '../../experiments/metricsAndParams/paths'
import { MetricsOrParams } from '../../experiments/webview/contract'
import { addToMapArray, addToMapCount } from '../../util/map'
import { getLabel, isCheckpoint } from '../../experiments/model/collect'

type LivePlotAccumulator = Map<string, LivePlotValues>

const collectFromMetricsFile = (
  acc: LivePlotAccumulator,
  name: string,
  iteration: number,
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const pathArray = [...ancestors, key].filter(Boolean) as string[]

  if (typeof value === 'object') {
    Object.entries(value as ValueTree).forEach(([childKey, childValue]) => {
      return collectFromMetricsFile(
        acc,
        name,
        iteration,
        childKey,
        childValue,
        pathArray
      )
    })
    return
  }

  const path = joinMetricOrParamFilePath(...pathArray)

  addToMapArray(acc, path, { group: name, iteration, y: value })
}

type MetricsAndDetailsOrUndefined =
  | {
      checkpoint_parent: string | undefined
      checkpoint_tip: string | undefined
      metrics: MetricsOrParams | undefined
      queued: boolean | undefined
      running: boolean | undefined
    }
  | undefined

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
): MetricsAndDetailsOrUndefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const { checkpoint_tip, checkpoint_parent, queued, running } =
    experimentFields
  const { metrics } = reduceMetricsAndParams(experimentFields)

  return { checkpoint_parent, checkpoint_tip, metrics, queued, running }
}

type ValidCheckpointData = {
  checkpoint_parent: string
  checkpoint_tip: string
  metrics: MetricsOrParams
  queued: boolean | undefined
  running: boolean | undefined
}

const isValidCheckpoint = (
  data: MetricsAndDetailsOrUndefined,
  sha: string
): data is ValidCheckpointData =>
  !!(isCheckpoint(data?.checkpoint_tip, sha) && data?.metrics)

const collectFromMetrics = (
  acc: LivePlotAccumulator,
  experimentName: string,
  iteration: number,
  metrics: MetricsOrParams
) => {
  Object.keys(metrics).forEach(file =>
    collectFromMetricsFile(
      acc,
      experimentName,
      iteration,
      undefined,
      metrics[file],
      [file]
    )
  )
}

const linkModified = (
  acc: LivePlotAccumulator,
  checkpointCount: Map<string, number>,
  currentCheckpoint: {
    experimentName: string
    checkpointParent: string
    checkpointTip: string
  },
  lastCheckpoint: {
    metrics: MetricsOrParams
    iteration: number
    checkpointTip: string
  }
) => {
  const { experimentName, checkpointParent, checkpointTip } = currentCheckpoint

  const {
    metrics: lastMetrics,
    checkpointTip: lastCheckpointTip,
    iteration: lastIteration
  } = lastCheckpoint

  if (lastCheckpointTip && checkpointParent === lastCheckpointTip) {
    checkpointCount.set(checkpointTip, lastIteration)
    collectFromMetrics(acc, experimentName, lastIteration, lastMetrics)
  }
}

const collectFromExperimentsObject = (
  acc: LivePlotAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError },
  checkpointCount = new Map<string, number>(),
  lastCheckpoint = { checkpointTip: '', iteration: 0, metrics: {} }
) => {
  for (const [sha, experimentData] of Object.entries(
    experimentsObject
  ).reverse()) {
    const data = transformExperimentData(experimentData)

    if (!isValidCheckpoint(data, sha)) {
      continue
    }
    const {
      checkpoint_tip: checkpointTip,
      checkpoint_parent: checkpointParent,
      metrics
    } = data

    const experimentName = experimentsObject[checkpointTip].data?.name
    if (!experimentName) {
      continue
    }

    linkModified(
      acc,
      checkpointCount,
      { checkpointParent, checkpointTip, experimentName },
      lastCheckpoint
    )

    const iteration = addToMapCount(checkpointTip, checkpointCount)
    collectFromMetrics(acc, experimentName, iteration, metrics)

    lastCheckpoint = { checkpointTip, iteration, metrics }
  }
}

export const collectLivePlotsData = (
  data: ExperimentsOutput
): LivePlotData[] | undefined => {
  const acc = new Map<string, LivePlotValues>()

  for (const { baseline, ...experimentsObject } of Object.values(
    omit(data, 'workspace')
  )) {
    const branch = transformExperimentData(baseline)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject)
    }
  }

  if (!acc.size) {
    return
  }

  const plotsData: LivePlotData[] = []

  acc.forEach((value, key) => {
    plotsData.push({ title: decodeMetricOrParam(key), values: value })
  })

  return plotsData
}

const collectMutableFromExperiment = (
  acc: string[],
  experimentsObject: {
    [sha: string]: ExperimentFieldsOrError
  }
) => {
  Object.entries(experimentsObject).map(([sha, experimentData]) => {
    if (sha === 'baseline') {
      return
    }
    const data = transformExperimentData(experimentData)
    if (!data?.running || data?.checkpoint_parent || data?.checkpoint_tip) {
      return
    }

    acc.push(getLabel(sha))
  })
}

export const collectMutableRevisions = (
  data: ExperimentsOutput,
  hasCheckpoints: boolean
): string[] => {
  if (hasCheckpoints) {
    return []
  }

  const acc: string[] = []

  if (data.workspace.baseline.data?.running) {
    acc.push('workspace')
  }

  for (const experimentsObject of Object.values(omit(data, 'workspace'))) {
    collectMutableFromExperiment(acc, experimentsObject)
  }
  return acc
}

export type RevisionData = {
  [revision: string]: {
    [path: string]: unknown[]
  }
}

export type ComparisonData = {
  [revision: string]: {
    [path: string]: ImagePlot
  }
}

const collectImageData = (
  acc: ComparisonData,
  path: string,
  plot: ImagePlot
) => {
  const rev = plot.revisions?.[0]
  if (!rev) {
    return
  }

  if (!acc[rev]) {
    acc[rev] = {}
  }

  acc[rev][path] = plot
}

const collectPlotData = (acc: RevisionData, path: string, plot: VegaPlot) => {
  plot.revisions?.forEach(rev => {
    if (!acc[rev]) {
      acc[rev] = {}
    }
    acc[rev][path] = []
  })
  ;(plot.content.data as { values: { rev: string }[] }).values.forEach(value =>
    (acc[value.rev][path] as unknown[]).push(value)
  )
}

export const collectData = (
  data: PlotsOutput
): { revisionData: RevisionData; comparisonData: ComparisonData } =>
  Object.entries(data).reduce(
    (acc, [path, plots]) => {
      plots.forEach(plot => {
        if (isImagePlot(plot)) {
          return collectImageData(acc.comparisonData, path, plot)
        }

        return collectPlotData(acc.revisionData, path, plot)
      })
      return acc
    },

    { comparisonData: {} as ComparisonData, revisionData: {} as RevisionData }
  )

export const collectTemplates = (data: PlotsOutput) =>
  Object.entries(data).reduce((acc, [path, plots]) => {
    plots.forEach(plot => {
      if (isImagePlot(plot) || acc[path]) {
        return
      }
      const template = {
        ...plot.content
      }
      delete template.data
      acc[path] = template
    })
    return acc
  }, {} as Record<string, VisualizationSpec>)

export const collectPaths = (
  data: PlotsOutput
): { plots: string[]; comparison: string[] } => {
  const { comparison, plots } = Object.entries(data).reduce(
    (acc, [path, plots]) => {
      plots.forEach(plot => {
        if (isImagePlot(plot)) {
          acc.comparison.add(path)
          return
        }
        acc.plots.add(path)
      })
      return acc
    },
    { comparison: new Set<string>(), plots: new Set<string>() }
  )
  return { comparison: [...comparison].sort(), plots: [...plots].sort() }
}
