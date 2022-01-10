import omit from 'lodash.omit'
import { LivePlotValues, LivePlotData } from '../webview/contract'
import {
  ExperimentFieldsOrError,
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
import { getDisplayName } from '../../experiments/model/collect'

type LivePlotAccumulator = Map<string, LivePlotValues>

const collectFromMetricsFile = (
  acc: LivePlotAccumulator,
  displayName: string,
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
        displayName,
        iteration,
        childKey,
        childValue,
        pathArray
      )
    })
    return
  }

  const path = joinMetricOrParamFilePath(...pathArray)

  addToMapArray(acc, path, { group: displayName, iteration, y: value })
}

type MetricsAndTipOrUndefined =
  | {
      checkpoint_tip: string | undefined
      metrics: MetricsOrParams | undefined
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
  const { metrics } = reduceMetricsAndParams(experimentFields)

  return { checkpoint_tip, metrics }
}

type ValidCheckpointData = { checkpoint_tip: string; metrics: MetricsOrParams }

const isValidCheckpoint = (
  data: MetricsAndTipOrUndefined,
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

    collectFromMetrics(
      acc,
      getDisplayName(checkpoint_tip, experimentName, false),
      iteration,
      metrics
    )
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
