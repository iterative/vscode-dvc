import omit from 'lodash.omit'
import { VisualizationSpec } from 'react-vega'
import {
  LivePlotValues,
  LivePlotData,
  PlotsOutput,
  isImagePlot,
  ImagePlot,
  VegaPlot
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
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
import { getDisplayId } from '../../experiments/model/collect'

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
    }
  | undefined

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
): MetricsAndDetailsOrUndefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const { checkpoint_tip, checkpoint_parent, queued } = experimentFields
  const { metrics } = reduceMetricsAndParams(experimentFields)

  return { checkpoint_parent, checkpoint_tip, metrics, queued }
}

type ValidCheckpointData = {
  checkpoint_parent: string
  checkpoint_tip: string
  metrics: MetricsOrParams
  queued: boolean | undefined
}

const isValidCheckpoint = (
  data: MetricsAndDetailsOrUndefined,
  sha: string
): data is ValidCheckpointData =>
  !!(data?.metrics && data?.checkpoint_tip && data?.checkpoint_tip !== sha)

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

const collectBranchRevisions = (
  acc: Set<string>,
  experimentsObject: ExperimentsBranchOutput
): void => {
  Object.entries(experimentsObject)
    .reverse()
    .map(([sha, experimentData]) => {
      if (sha === 'baseline') {
        return
      }
      const data = transformExperimentData(experimentData)
      if (!data || data.queued) {
        return
      }

      const revSha = data.checkpoint_tip || sha

      acc.add(getDisplayId(revSha))
    })
}

export const collectRevisions = (data: ExperimentsOutput): string[] => {
  const acc: Set<string> = new Set()

  for (const experimentsObject of Object.values(omit(data, 'workspace'))) {
    const branchName = experimentsObject.baseline.data?.name

    if (branchName) {
      acc.add(branchName)
    }

    collectBranchRevisions(acc, experimentsObject)
  }
  return [...acc]
}

type ImageAccumulator = Record<string, Record<string, { url: string }>>

const collectImageData = (
  acc: ImageAccumulator,
  path: string,
  plot: ImagePlot
) => {
  if (!acc[path]) {
    acc[path] = {}
  }
  const rev = plot.revisions?.[0]
  if (!rev) {
    return
  }
  acc[path][rev] = { url: plot.url }
}

type PlotsAccumulator = Record<string, Record<string, unknown[]>>

const collectPlotData = (
  acc: PlotsAccumulator,
  path: string,
  plot: VegaPlot
) => {
  if (!acc[path]) {
    acc[path] = {}
  }

  plot.revisions?.forEach(rev => (acc[path][rev] = []))
  ;(plot.content.data as { values: { rev: string }[] }).values.forEach(value =>
    acc[path][value.rev].push(value)
  )
}

type Accumulator = {
  plots: PlotsAccumulator
  images: ImageAccumulator
}

export const collectRevisionData = (data: PlotsOutput): Accumulator =>
  Object.entries(data).reduce(
    (acc, [path, plots]) => {
      plots.forEach(plot => {
        if (isImagePlot(plot)) {
          return collectImageData(acc.images, path, plot)
        }

        return collectPlotData(acc.plots, path, plot)
      })
      return acc
    },
    {
      images: {} as ImageAccumulator,
      plots: {} as PlotsAccumulator
    }
  )

export const collectTemplates = (data: PlotsOutput) =>
  Object.entries(data).reduce((acc, [path, plots]) => {
    plots.forEach(plot => {
      if (isImagePlot(plot)) {
        return
      }
      if (acc[path]) {
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
