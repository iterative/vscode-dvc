import {
  MarkdownString,
  ThemeIcon,
  TreeItemCollapsibleState,
  Uri
} from 'vscode'
import { ExperimentType } from '.'
import { extractColumns } from '../columns/extract'
import { Experiment, CommitData, RunningExperiment } from '../webview/contract'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentStatus,
  ExpShowOutput,
  ExpState,
  Executor,
  ExpRange,
  ExecutorState,
  experimentHasError,
  ExpData
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

type ExperimentsAccumulator = {
  commits: Experiment[]
  experimentsByCommit: Map<string, Experiment[]>
  hasCheckpoints: boolean
  runningExperiments: RunningExperiment[]
  workspace: Experiment
}

const transformColumns = (
  experiment: Experiment,
  experimentFields: ExpData,
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

const getCommitData = (
  commitsOutput: string | undefined
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

const transformExpState = (
  experiment: Experiment,
  expState: ExpState,
  baseline?: Experiment
) => {
  const { rev } = expState

  if (rev.length === 40) {
    experiment.sha = rev
  }

  if (experimentHasError(expState)) {
    const error = expState.error.msg
    experiment.error = error
    return experiment
  }

  const { data } = expState
  if (data) {
    transformColumns(experiment, data, baseline)
  }

  return experiment
}

const addCommitData = (
  baseline: Experiment,
  commitData: { [sha: string]: CommitData } = {}
): void => {
  const { sha } = baseline
  if (!sha) {
    return
  }

  const commit = commitData[sha]

  if (!commit) {
    return
  }
  baseline.description = formatCommitMessage(commit.message)
  baseline.commit = commit
}

const collectExpState = (
  acc: ExperimentsAccumulator,
  expState: ExpState,
  commitData: { [sha: string]: CommitData }
): Experiment | undefined => {
  const { rev, name } = expState
  const label =
    rev === EXPERIMENT_WORKSPACE_ID
      ? EXPERIMENT_WORKSPACE_ID
      : name || shortenForLabel(rev)
  const id = name || label

  const experiment: Experiment = { id, label }

  const baseline = transformExpState(experiment, expState)

  if (rev === EXPERIMENT_WORKSPACE_ID && !name) {
    acc.workspace = baseline
    return
  }

  addCommitData(baseline, commitData)

  acc.commits.push(baseline)
  return baseline
}

const getExecutor = (experiment: Experiment): Executor => {
  if ([experiment.executor, experiment.id].includes(EXPERIMENT_WORKSPACE_ID)) {
    return Executor.WORKSPACE
  }
  return Executor.DVC_TASK
}

const collectExecutorInfo = (
  acc: ExperimentsAccumulator,
  experiment: Experiment,
  executor: ExecutorState
): void => {
  if (!executor) {
    return
  }

  const { name, state } = executor

  if (name && state === ExperimentStatus.RUNNING) {
    experiment.executor = name
  }
  if (state && state !== ExperimentStatus.SUCCESS) {
    experiment.status = state
  }

  if (experiment.status === ExperimentStatus.RUNNING) {
    acc.runningExperiments.push({
      executor: getExecutor(experiment),
      id: experiment.id
    })
  }
}

const collectExpRange = (
  acc: ExperimentsAccumulator,
  baseline: Experiment,
  expRange: ExpRange
): void => {
  const { revs, executor } = expRange
  if (!revs?.length) {
    return
  }
  const expState = revs[0]

  const { name, rev } = expState

  const label =
    rev === EXPERIMENT_WORKSPACE_ID
      ? EXPERIMENT_WORKSPACE_ID
      : shortenForLabel(rev)

  const experiment = transformExpState(
    {
      id: name || label,
      label
    },
    expState,
    baseline
  )

  if (name) {
    experiment.description = `[${name}]`
  }

  collectExecutorInfo(acc, experiment, executor)

  addToMapArray(acc.experimentsByCommit, baseline.id, experiment)
}

const setWorkspaceAsRunning = (
  acc: ExperimentsAccumulator,
  dvcLiveOnly: boolean
) => {
  if (
    dvcLiveOnly ||
    acc.runningExperiments.some(
      ({ executor, id }) =>
        executor === Executor.WORKSPACE && id !== EXPERIMENT_WORKSPACE_ID
    )
  ) {
    acc.workspace.executor = Executor.WORKSPACE
    acc.workspace.status = ExperimentStatus.RUNNING
    acc.runningExperiments.unshift({
      executor: Executor.WORKSPACE,
      id: EXPERIMENT_WORKSPACE_ID
    })
  }
}

const hasCheckpoints = (data: ExpShowOutput) => {
  if (!data?.length) {
    return false
  }

  const [workspace] = data

  if (experimentHasError(workspace)) {
    return false
  }

  return !!workspace.data.meta.has_checkpoints
}

export const collectExperiments = (
  output: ExpShowOutput,
  dvcLiveOnly: boolean,
  commitsOutput: string | undefined
): ExperimentsAccumulator => {
  const acc: ExperimentsAccumulator = {
    commits: [],
    experimentsByCommit: new Map(),
    hasCheckpoints: hasCheckpoints(output),
    runningExperiments: [],
    workspace: { id: EXPERIMENT_WORKSPACE_ID, label: EXPERIMENT_WORKSPACE_ID }
  }

  const commitData = getCommitData(commitsOutput)

  for (const expState of output) {
    const baseline = collectExpState(acc, expState, commitData)
    const { experiments } = expState

    if (!(baseline && experiments?.length)) {
      continue
    }

    for (const expRange of experiments) {
      collectExpRange(acc, baseline, expRange)
    }
  }

  setWorkspaceAsRunning(acc, dvcLiveOnly)

  return acc
}

type ExperimentTypesAccumulator = { [dvcRoot: string]: Set<string> }

const initializeAccumulatorRoot = (
  acc: ExperimentTypesAccumulator,
  dvcRoot: string
) => {
  if (!acc[dvcRoot]) {
    acc[dvcRoot] = new Set<string>()
  }
}

const collectExperimentItem = (
  acc: ExperimentTypesAccumulator,
  types: Set<string>,
  experimentItem: ExperimentItem
) => {
  const { dvcRoot, type, id, label } = experimentItem
  if (!types.has(type)) {
    return
  }
  initializeAccumulatorRoot(acc, dvcRoot)
  if (type === ExperimentType.QUEUED) {
    acc[dvcRoot].add(label)
    return
  }

  acc[dvcRoot].add(id)
}

export const collectExperimentType = (
  experimentItems: (string | ExperimentItem)[],
  types: Set<ExperimentType>
): ExperimentTypesAccumulator => {
  const acc: ExperimentTypesAccumulator = {}
  for (const experimentItem of experimentItems) {
    if (typeof experimentItem === 'string') {
      continue
    }

    collectExperimentItem(acc, types, experimentItem)
  }

  return acc
}
