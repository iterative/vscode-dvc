import {
  MarkdownString,
  ThemeIcon,
  TreeItemCollapsibleState,
  Uri
} from 'vscode'
import omit from 'lodash.omit'
import { ExperimentType } from '.'
import { ExperimentsAccumulator } from './accumulator'
import { extractColumns } from '../columns/extract'
import { Experiment, ColumnType } from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchOutput,
  ExperimentsOutput
} from '../../cli/dvc/reader'
import { addToMapArray } from '../../util/map'
import { uniqueValues } from '../../util/array'
import { RegisteredCommands } from '../../commands/external'
import { Resource } from '../../resourceLocator'
import { shortenForLabel } from '../../util/string'

export type ExperimentItem = {
  command?: {
    arguments: { dvcRoot: string; id: string }[]
    command: RegisteredCommands
    title: string
  }
  dvcRoot: string
  description: string | undefined
  id: string
  label: string
  collapsibleState: TreeItemCollapsibleState
  type: ExperimentType
  iconPath: ThemeIcon | Uri | Resource
  tooltip: MarkdownString | undefined
}

type ExperimentsObject = { [sha: string]: ExperimentFieldsOrError }

export const isCheckpoint = (
  checkpointTip: string | undefined,
  sha: string
): checkpointTip is string => !!(checkpointTip && checkpointTip !== sha)

const getExperimentId = (
  sha: string,
  experimentsFields?: ExperimentFields
): string => {
  if (!experimentsFields) {
    return sha
  }

  const { name, checkpoint_tip } = experimentsFields

  if (isCheckpoint(checkpoint_tip, sha)) {
    return sha
  }

  return name || sha
}

const getDisplayNameOrParent = (
  sha: string,
  branchSha: string,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
): string | undefined => {
  const experiment = experimentsObject[sha]?.data
  if (!experiment) {
    return
  }

  const {
    checkpoint_parent: checkpointParent,
    checkpoint_tip: checkpointTip,
    name
  } = experiment
  if (
    checkpointParent &&
    branchSha !== checkpointParent &&
    experimentsObject[checkpointParent]?.data?.checkpoint_tip !== checkpointTip
  ) {
    return `(${shortenForLabel(checkpointParent)})`
  }
  if (name) {
    return `[${name}]`
  }
}

const getLogicalGroupName = (
  sha: string,
  branchSha: string,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
): string | undefined => {
  const experiment = experimentsObject[sha]?.data

  const { checkpoint_tip: checkpointTip = undefined, name = undefined } =
    experiment || {}

  if (name) {
    return `[${name}]`
  }

  return (
    getDisplayNameOrParent(sha, branchSha, experimentsObject) ||
    (checkpointTip && checkpointTip !== sha
      ? getLogicalGroupName(checkpointTip, branchSha, experimentsObject)
      : undefined)
  )
}

const getCheckpointTipId = (
  checkpointTip: string | undefined,
  experimentsObject: ExperimentsObject
): string | undefined => {
  if (!checkpointTip) {
    return
  }
  return experimentsObject[checkpointTip]?.data?.name
}

const transformColumns = (
  experiment: Experiment,
  experimentFields: ExperimentFields,
  branch?: Experiment
) => {
  const { error, metrics, params, deps } = extractColumns(
    experimentFields,
    branch
  )

  if (metrics) {
    experiment.metrics = metrics
  }
  if (params) {
    experiment.params = params
  }
  if (deps) {
    experiment.deps = deps
  }
  if (error) {
    experiment.error = error
  }
}

const transformExperimentData = (
  id: string,
  experimentFieldsOrError: ExperimentFieldsOrError,
  label: string | undefined,
  sha?: string,
  displayNameOrParent?: string,
  logicalGroupName?: string,
  branch?: Experiment
): Experiment => {
  const data = experimentFieldsOrError.data || {}

  const error = experimentFieldsOrError.error

  const experiment = {
    id,
    label,
    ...omit(data, Object.values(ColumnType))
  } as Experiment

  if (displayNameOrParent) {
    experiment.displayNameOrParent = displayNameOrParent
  }

  if (logicalGroupName) {
    experiment.logicalGroupName = logicalGroupName
  }

  if (sha) {
    experiment.sha = sha
  }

  if (error) {
    experiment.error = error.msg
  }

  transformColumns(experiment, data, branch)

  return experiment
}

const transformExperimentOrCheckpointData = (
  sha: string,
  experimentData: ExperimentFieldsOrError,
  experimentsObject: ExperimentsObject,
  branchSha: string,
  branch: Experiment
): {
  checkpointTipId?: string
  experiment: Experiment | undefined
} => {
  const experimentFields = experimentData.data
  if (!experimentFields) {
    const error = experimentData?.error?.msg
    return { experiment: { error, id: sha, label: shortenForLabel(sha) } }
  }

  const checkpointTipId = getCheckpointTipId(
    experimentFields.checkpoint_tip,
    experimentsObject
  )

  const id = getExperimentId(sha, experimentFields)

  return {
    checkpointTipId,
    experiment: transformExperimentData(
      id,
      experimentData,
      shortenForLabel(sha),
      sha,
      getDisplayNameOrParent(sha, branchSha, experimentsObject),
      getLogicalGroupName(sha, branchSha, experimentsObject),
      branch
    )
  }
}

const collectHasRunningExperiment = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
) => {
  if (experiment.running) {
    acc.hasRunning = true
  }
}

const collectExperimentOrCheckpoint = (
  acc: ExperimentsAccumulator,
  experiment: Experiment,
  branchName: string,
  checkpointTipId: string | undefined
) => {
  const { checkpoint_tip: checkpointTip, sha } = experiment
  if (isCheckpoint(checkpointTip, sha as string)) {
    if (!checkpointTipId) {
      return
    }
    addToMapArray(acc.checkpointsByTip, checkpointTipId, experiment)
    return
  }
  addToMapArray(acc.experimentsByBranch, branchName, experiment)
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: ExperimentsObject,
  branchSha: string,
  branch: Experiment
) => {
  const branchName = branch.label

  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const { checkpointTipId, experiment } = transformExperimentOrCheckpointData(
      sha,
      experimentData,
      experimentsObject,
      branchSha,
      branch
    )
    if (!experiment) {
      continue
    }

    collectExperimentOrCheckpoint(acc, experiment, branchName, checkpointTipId)
    collectHasRunningExperiment(acc, experiment)
  }
}

const collectFromBranchesObject = (
  acc: ExperimentsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchOutput }
) => {
  for (const [sha, { baseline, ...experimentsObject }] of Object.entries(
    branchesObject
  )) {
    const name = baseline.data?.name || sha
    const branch = transformExperimentData(name, baseline, name, sha)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject, sha, branch)
      collectHasRunningExperiment(acc, branch)

      acc.branches.push(branch)
    }
  }
}

export const collectExperiments = (
  data: ExperimentsOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceId = 'workspace'

  const workspaceBaseline = transformExperimentData(
    workspaceId,
    workspace.baseline,
    workspaceId
  )

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}

const getDefaultMutableRevision = (hasCheckpoints: boolean): string[] => {
  if (hasCheckpoints) {
    return []
  }
  return ['workspace']
}

const noWorkspaceVsSelectedRaceCondition = (
  hasCheckpoints: boolean,
  running: boolean | undefined,
  selected: boolean | undefined
): boolean => !!(hasCheckpoints && running && !selected)

const collectMutableRevision = (
  acc: string[],
  { label, running, selected }: Experiment,
  hasCheckpoints: boolean
) => {
  if (noWorkspaceVsSelectedRaceCondition(hasCheckpoints, running, selected)) {
    acc.push('workspace')
  }
  if (running && !hasCheckpoints) {
    acc.push(label)
  }
}

export const collectMutableRevisions = (
  experiments: Experiment[],
  hasCheckpoints: boolean
): string[] => {
  const acc = getDefaultMutableRevision(hasCheckpoints)

  for (const experiment of experiments) {
    collectMutableRevision(acc, experiment, hasCheckpoints)
  }

  return uniqueValues(acc)
}

type DeletableExperimentAccumulator = { [dvcRoot: string]: Set<string> }

const initializeAccumulatorRoot = (
  acc: DeletableExperimentAccumulator,
  dvcRoot: string
) => {
  if (!acc[dvcRoot]) {
    acc[dvcRoot] = new Set<string>()
  }
}

const collectExperimentItem = (
  acc: DeletableExperimentAccumulator,
  deletable: Set<string>,
  experimentItem: ExperimentItem
) => {
  const { dvcRoot, type, id, label } = experimentItem
  if (!deletable.has(type)) {
    return
  }
  initializeAccumulatorRoot(acc, dvcRoot)
  if (type === ExperimentType.QUEUED) {
    acc[dvcRoot].add(label)
    return
  }

  acc[dvcRoot].add(id)
}

export const collectDeletable = (
  experimentItems: (string | ExperimentItem)[]
): DeletableExperimentAccumulator => {
  const deletable = new Set([ExperimentType.EXPERIMENT, ExperimentType.QUEUED])

  const acc: DeletableExperimentAccumulator = {}
  for (const experimentItem of experimentItems) {
    if (typeof experimentItem === 'string') {
      continue
    }

    collectExperimentItem(acc, deletable, experimentItem)
  }

  return acc
}
