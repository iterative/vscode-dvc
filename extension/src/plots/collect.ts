import { PlotData } from './webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsBranchJSONOutput,
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree
} from '../cli/reader'
import { reduceParamsAndMetrics } from '../experiments/paramsAndMetrics/reduce'
import { joinParamOrMetricPath } from '../experiments/paramsAndMetrics/paths'
import { ParamsOrMetrics } from '../experiments/webview/contract'

const addToMapArray = <K = string, V = unknown>(
  map: Map<K, V[]>,
  key: K,
  value: V
): void => {
  const existingArray = map.get(key)
  if (existingArray) {
    existingArray.push(value)
  } else {
    const newArray = [value]
    map.set(key, newArray)
  }
}

const collectPlotData = (
  acc: LivePlotAccumulator,
  displayName: string,
  iteration: number,
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const newAncestors = [...ancestors, key].filter(Boolean) as string[]
  if (typeof value === 'object') {
    Object.entries(value as ValueTree).forEach(([childKey, childValue]) => {
      return collectPlotData(
        acc,
        displayName,
        iteration,
        childKey,
        childValue,
        newAncestors
      )
    })
    return
  }

  const path = joinParamOrMetricPath(...newAncestors)

  addToMapArray(acc, path, { group: displayName, x: iteration, y: value })
}

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
) => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const { checkpoint_tip } = experimentFields
  const { metrics } = reduceParamsAndMetrics(experimentFields)

  return { checkpoint_tip, metrics }
}

const getIteration = (
  checkpointTip: string,
  checkpointCount: Map<string, number>
): number => {
  let iteration = checkpointCount.get(checkpointTip) || 0
  iteration++
  checkpointCount.set(checkpointTip, iteration)
  return iteration
}

const isValidCheckpoint = (
  data:
    | {
        checkpoint_tip: string | undefined
        metrics: ParamsOrMetrics | undefined
      }
    | undefined,
  sha: string
): data is { checkpoint_tip: string; metrics: ParamsOrMetrics } =>
  !!(data?.metrics && data?.checkpoint_tip && data?.checkpoint_tip !== sha)

const collectPlotsData = (
  acc: LivePlotAccumulator,
  experimentName: string,
  iteration: number,
  metrics: ParamsOrMetrics
) => {
  Object.keys(metrics).forEach(file =>
    collectPlotData(acc, experimentName, iteration, undefined, metrics[file], [
      'metrics',
      file
    ])
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
    const iteration = getIteration(checkpoint_tip, checkpointCount)

    const experimentName = experimentsObject[checkpoint_tip].data?.name
    if (!experimentName) {
      continue
    }

    collectPlotsData(acc, experimentName, iteration, metrics)
  }
}

const collectFromBranchesObject = (
  acc: LivePlotAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchJSONOutput }
) => {
  for (const { baseline, ...experimentsObject } of Object.values(
    branchesObject
  )) {
    const branch = transformExperimentData(baseline)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject)
    }
  }
}

export type LivePlotAccumulator = Map<string, PlotData>

export const collectLivePlots = (
  data: ExperimentsRepoJSONOutput
): LivePlotAccumulator => {
  const { workspace, ...branchesObject } = data

  const acc = new Map<string, PlotData>()

  collectFromBranchesObject(acc, branchesObject)

  return acc
}
