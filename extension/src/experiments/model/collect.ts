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
import {
  Experiment,
  ColumnType,
  isRunning,
  CommitData
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsCommitOutput,
  ExperimentsOutput,
  EXPERIMENT_WORKSPACE_ID,
  ExperimentStatus
} from '../../cli/dvc/contract'
import { addToMapArray } from '../../util/map'
import { RegisteredCommands } from '../../commands/external'
import { Resource } from '../../resourceLocator'
import { shortenForLabel } from '../../util/string'
import { COMMITS_SEPARATOR } from '../../cli/git/constants'

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

const getDisplayName = (
  sha: string,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
): string | undefined => {
  const experiment = experimentsObject[sha]?.data
  if (!experiment) {
    return
  }

  const { name } = experiment
  if (name) {
    return `[${name}]`
  }
}

const transformColumns = (
  experiment: Experiment,
  experimentFields: ExperimentFields,
  commit?: Experiment
) => {
  const { error, metrics, params, deps, Created } = extractColumns(
    experimentFields,
    commit
  )

  if (Created) {
    experiment.Created = Created
  }
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

const mergeErrors = (
  experimentFieldsOrError: ExperimentFieldsOrError
): string | undefined =>
  experimentFieldsOrError.error?.msg || experimentFieldsOrError.data?.error?.msg

const transformExperimentData = (
  id: string,
  experimentFieldsOrError: ExperimentFieldsOrError,
  label: string | undefined,
  sha?: string,
  displayName?: string,
  commit?: Experiment
): Experiment => {
  const data = experimentFieldsOrError.data || {}

  const error = mergeErrors(experimentFieldsOrError)

  const experiment = {
    id,
    label,
    ...omit(data, Object.values(ColumnType))
  } as Experiment

  if (displayName) {
    experiment.displayName = displayName
  }

  if (experiment.name && displayName) {
    experiment.logicalGroupName = displayName
  }

  if (sha) {
    experiment.sha = sha
  }

  if (error) {
    experiment.error = error
  }

  transformColumns(experiment, data, commit)

  return experiment
}

const transformExperimentOrCheckpointData = (
  sha: string,
  experimentData: ExperimentFieldsOrError,
  experimentsObject: ExperimentsObject,
  commit: Experiment
): Experiment | undefined => {
  const experimentFields = experimentData.data
  if (!experimentFields) {
    const error = experimentData?.error?.msg
    return { error, id: sha, label: shortenForLabel(sha) }
  }

  if (isCheckpoint(experimentFields.checkpoint_tip, sha)) {
    return
  }

  const id = getExperimentId(sha, experimentFields)

  return transformExperimentData(
    id,
    experimentData,
    shortenForLabel(sha),
    sha,
    getDisplayName(sha, experimentsObject),
    commit
  )
}

const collectHasRunningExperiment = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
) => {
  const { executor, id, status } = experiment
  if (isRunning(status) && executor) {
    acc.runningExperiments.push({ executor, id })
  }
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: ExperimentsObject,
  commit: Experiment
) => {
  const commitName = commit.label

  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment = transformExperimentOrCheckpointData(
      sha,
      experimentData,
      experimentsObject,
      commit
    )
    if (!experiment) {
      continue
    }

    addToMapArray(acc.experimentsByCommit, commitName, experiment)
    collectHasRunningExperiment(acc, experiment)
  }
}

const collectFromCommits = (
  acc: ExperimentsAccumulator,
  commitsObject: { [name: string]: ExperimentsCommitOutput }
) => {
  for (const [sha, { baseline, ...experimentsObject }] of Object.entries(
    commitsObject
  )) {
    let name = baseline.data?.name
    let label = name

    if (!name) {
      name = sha
      label = shortenForLabel(name)
    }
    const commit = transformExperimentData(name, baseline, label, sha)

    if (commit) {
      collectFromExperimentsObject(acc, experimentsObject, commit)
      collectHasRunningExperiment(acc, commit)

      acc.commits.push(commit)
    }
  }
}

const getCommitDataFromOutput = (
  output: string
): CommitData & { hash: string } => {
  const data: CommitData & { hash: string } = {
    author: '',
    date: '',
    hash: '',
    message: '',
    tags: []
  }
  const [hash, author, date, refNamesWithKey] = output
    .split('\n')
    .filter(Boolean)
  data.hash = hash
  data.author = author
  data.date = date

  const message = output.match(/\nmessage:(.+)/s) || []
  data.message = message[1] || ''

  const refNames = refNamesWithKey.slice('refNames:'.length)
  data.tags = refNames
    .split(', ')
    .filter(item => item.startsWith('tag: '))
    .map(item => item.slice('tag: '.length))

  return data
}

const formatCommitMessage = (commit: string) => {
  const lines = commit.split('\n').filter(Boolean)
  return `${lines[0]}${lines.length > 1 ? ' ...' : ''}`
}

const getCommitMessages = (
  commitsOutput: string
): { [sha: string]: CommitData } => {
  if (!commitsOutput) {
    return {}
  }
  const commits = commitsOutput.split(COMMITS_SEPARATOR).map(commit => {
    const { hash, ...rest } = getCommitDataFromOutput(commit)
    return [hash, { ...rest }]
  })
  return Object.fromEntries(commits) as { [sha: string]: CommitData }
}

const addDataToCommits = (
  commits: Experiment[],
  commitsOutput: string
): Experiment[] => {
  const commitMessages = getCommitMessages(commitsOutput)
  return commits.map(commit => {
    const { sha } = commit
    if (sha && commitMessages[sha]) {
      commit.displayName = formatCommitMessage(commitMessages[sha].message)
      commit.commit = commitMessages[sha]
    }
    return commit
  })
}

export const collectExperiments = (
  data: ExperimentsOutput,
  dvcLiveOnly: boolean,
  commitsOutput: string
): ExperimentsAccumulator => {
  const { workspace, ...commitsObject } = data

  const workspaceBaseline = transformExperimentData(
    EXPERIMENT_WORKSPACE_ID,
    workspace.baseline,
    EXPERIMENT_WORKSPACE_ID
  )

  if (dvcLiveOnly) {
    workspaceBaseline.executor = EXPERIMENT_WORKSPACE_ID
    workspaceBaseline.status = ExperimentStatus.RUNNING
  }

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromCommits(acc, commitsObject)

  acc.commits = addDataToCommits(acc.commits, commitsOutput)

  return acc
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
