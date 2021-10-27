import omit from 'lodash.omit'
import { PlotData } from './webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree
} from '../cli/reader'
import { reduceParamsAndMetrics } from '../experiments/paramsAndMetrics/reduce'
import { joinParamOrMetricPath } from '../experiments/paramsAndMetrics/paths'
import { ParamsOrMetrics } from '../experiments/webview/contract'
import { addToMapArray, addToMapCount } from '../util/map'

const collectFromMetricsFile = (
  acc: LivePlotAccumulator,
  displayName: string,
  iteration: number,
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const ancestorsWithKey = [...ancestors, key].filter(Boolean) as string[]

  if (typeof value === 'object') {
    Object.entries(value as ValueTree).forEach(([childKey, childValue]) => {
      return collectFromMetricsFile(
        acc,
        displayName,
        iteration,
        childKey,
        childValue,
        ancestorsWithKey
      )
    })
    return
  }

  const path = joinParamOrMetricPath(...ancestorsWithKey)

  addToMapArray(acc, path, { group: displayName, x: iteration, y: value })
}

type MetricsAndTipOrUndefined =
  | {
      checkpoint_tip: string | undefined
      metrics: ParamsOrMetrics | undefined
    }
  | undefined

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
): MetricsAndTipOrUndefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const { checkpoint_tip } = experimentFields
  const { metrics } = reduceParamsAndMetrics(experimentFields)

  return { checkpoint_tip, metrics }
}

type ValidCheckpointData = { checkpoint_tip: string; metrics: ParamsOrMetrics }

const isValidCheckpoint = (
  data: MetricsAndTipOrUndefined,
  sha: string
): data is ValidCheckpointData =>
  !!(data?.metrics && data?.checkpoint_tip && data?.checkpoint_tip !== sha)

const collectFromMetrics = (
  acc: LivePlotAccumulator,
  experimentName: string,
  iteration: number,
  metrics: ParamsOrMetrics
) => {
  Object.keys(metrics).forEach(file =>
    collectFromMetricsFile(
      acc,
      experimentName,
      iteration,
      undefined,
      metrics[file],
      ['metrics', file]
    )
  )
}

const collectFromExperimentsObject = (
  acc: LivePlotAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError },
  checkpointCount = new Map<string, number>()
) => {
  for (const [sha, experimentData] of Object.entries(
    experimentsObject
  ).reverse()) {
    const data = transformExperimentData(experimentData)

    if (!isValidCheckpoint(data, sha)) {
      continue
    }
    const { checkpoint_tip, metrics } = data
    const iteration = addToMapCount(checkpoint_tip, checkpointCount)

    const experimentName = experimentsObject[checkpoint_tip].data?.name
    if (!experimentName) {
      continue
    }

    collectFromMetrics(acc, experimentName, iteration, metrics)
  }
}

export type LivePlotAccumulator = Map<string, PlotData>

export const collectLivePlotsData = (
  data: ExperimentsRepoJSONOutput
): LivePlotAccumulator => {
  const acc = new Map<string, PlotData>()

  for (const { baseline, ...experimentsObject } of Object.values(
    omit(data, 'workspace')
  )) {
    const branch = transformExperimentData(baseline)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject)
    }
  }

  return acc
}
