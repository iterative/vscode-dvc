import {
  MarkdownString,
  ThemeIcon,
  TreeItemCollapsibleState,
  Uri
} from 'vscode'
import { ExperimentType } from '.'
import { extractColumns } from '../columns/extract'
import {
  CommitData,
  Experiment,
  RunningExperiment,
  isQueued,
  isRunning
} from '../webview/contract'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExecutorStatus,
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
import { trimAndSplit } from '../../util/stdout'

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
  cliError: string | undefined
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

const skipCommit = (
  acc: { [sha: string]: CommitData },
  sha: string | undefined
): boolean => !sha || !!acc[sha]

const collectCommitData = (
  acc: { [sha: string]: CommitData },
  commit: string
) => {
  const [sha, author, date, refNamesWithKey] = trimAndSplit(commit)

  if (skipCommit(acc, sha)) {
    return
  }

  const commitData: CommitData = {
    author: author || '',
    date: date || '',
    message: (commit.match(/\nmessage:(.+)/s) || [])[1] || '',
    tags: []
  }

  if (refNamesWithKey) {
    const refNames = refNamesWithKey.slice('refNames:'.length)
    commitData.tags = refNames
      .split(', ')
      .filter(item => item.startsWith('tag: '))
      .map(item => item.slice('tag: '.length))
  }
  acc[sha] = commitData
}

const collectCommitsData = (output: string): { [sha: string]: CommitData } => {
  const acc: { [sha: string]: CommitData } = {}

  for (const commit of output.split(COMMITS_SEPARATOR)) {
    collectCommitData(acc, commit)
  }
  return acc
}

const formatCommitMessage = (commit: string | undefined) => {
  if (!commit) {
    return undefined
  }
  const lines = trimAndSplit(commit)
  return `${lines[0]}${lines.length > 1 ? ' ...' : ''}`
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

  const commit: CommitData | undefined = commitData[rev]
  const description: string | undefined = formatCommitMessage(commit?.message)

  const experiment: Experiment = {
    commit,
    description,
    id,
    label
  }

  const baseline = transformExpState(experiment, expState)

  if (rev === EXPERIMENT_WORKSPACE_ID && !name) {
    acc.workspace = baseline
    return
  }

  acc.commits.push(baseline)
  return baseline
}

export const collectAddRemoveCommitsDetails = (
  availableNbCommits: {
    [branch: string]: number
  },
  getNbOfCommitsToShow: (branch: string) => number
): {
  hasMoreCommits: { [branch: string]: boolean }
  isShowingMoreCommits: { [branch: string]: boolean }
} => {
  const hasMoreCommits: { [branch: string]: boolean } = {}
  const isShowingMoreCommits: { [branch: string]: boolean } = {}

  for (const [branch, availableCommits] of Object.entries(availableNbCommits)) {
    const nbOfCommitsToShow = getNbOfCommitsToShow(branch)
    hasMoreCommits[branch] = availableCommits > nbOfCommitsToShow
    isShowingMoreCommits[branch] =
      Math.min(nbOfCommitsToShow, availableCommits) > 1
  }

  return { hasMoreCommits, isShowingMoreCommits }
}

const getExecutor = (experiment: Experiment): Executor => {
  if ([experiment.executor, experiment.id].includes(EXPERIMENT_WORKSPACE_ID)) {
    return Executor.WORKSPACE
  }
  return Executor.DVC_TASK
}

const collectExecutorInfo = (
  experiment: Experiment,
  executor: ExecutorState
): void => {
  if (!executor) {
    return
  }

  const { name, state } = executor

  if (name && state === ExecutorStatus.RUNNING) {
    experiment.executor = name
  }
  if (state && state !== ExecutorStatus.SUCCESS) {
    experiment.executorStatus = state
  }
}

const collectRunningExperiment = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
): void => {
  if (!isRunning(experiment.executorStatus)) {
    return
  }
  acc.runningExperiments.push({
    executor: getExecutor(experiment),
    id: experiment.id
  })
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
  const { id: baselineId, sha: baselineSha } = baseline

  const label =
    rev === EXPERIMENT_WORKSPACE_ID
      ? EXPERIMENT_WORKSPACE_ID
      : shortenForLabel(rev)

  const experimentId = name || label

  if (
    acc.experimentsByCommit
      .get(baselineId)
      ?.find(({ id }) => id === experimentId)
  ) {
    return
  }

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

  experiment.baselineSha = baselineSha

  collectExecutorInfo(experiment, executor)
  collectRunningExperiment(acc, experiment)

  addToMapArray(acc.experimentsByCommit, baselineId, experiment)
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
    acc.workspace.executorStatus = ExecutorStatus.RUNNING
  }

  if (dvcLiveOnly) {
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

  return !!workspace?.data?.meta.has_checkpoints
}

const collectCliError = (
  acc: ExperimentsAccumulator,
  expShow: ExpShowOutput
) => {
  if (expShow.length === 1 && acc.workspace.error) {
    acc.cliError = acc.workspace.error
  }
}

export const collectExperiments = (
  expShow: ExpShowOutput,
  gitLog: string,
  dvcLiveOnly: boolean
): ExperimentsAccumulator => {
  const acc: ExperimentsAccumulator = {
    cliError: undefined,
    commits: [],
    experimentsByCommit: new Map(),
    hasCheckpoints: hasCheckpoints(expShow),
    runningExperiments: [],
    workspace: {
      id: EXPERIMENT_WORKSPACE_ID,
      label: EXPERIMENT_WORKSPACE_ID
    }
  }

  const commitData = collectCommitsData(gitLog)

  for (const expState of expShow) {
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

  collectCliError(acc, expShow)

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

const collectExperimentsAndCommit = (
  acc: Experiment[],
  commit: Experiment,
  experiments: Experiment[] = []
): void => {
  acc.push(commit)
  for (const experiment of experiments) {
    if (isQueued(experiment.executorStatus)) {
      continue
    }
    acc.push(experiment)
  }
}

export const collectOrderedCommitsAndExperiments = (
  commits: Experiment[],
  getExperimentsByCommit: (commit: Experiment) => Experiment[] | undefined
): Experiment[] => {
  const acc: Experiment[] = []
  for (const commit of commits) {
    collectExperimentsAndCommit(acc, commit, getExperimentsByCommit(commit))
  }
  return acc
}

export const collectRunningInQueue = (
  ids: Set<string>,
  runningExperiments: RunningExperiment[]
): string[] | undefined => {
  const runningInQueueIds = new Set<string>()
  for (const { executor, id } of runningExperiments) {
    if (!ids.has(id)) {
      continue
    }
    if (executor === Executor.DVC_TASK) {
      runningInQueueIds.add(id)
    }
  }
  return runningInQueueIds.size > 0 ? [...runningInQueueIds] : undefined
}

export const collectRunningInWorkspace = (
  ids: Set<string>,
  runningExperiments: RunningExperiment[]
): string | undefined => {
  for (const { executor, id } of runningExperiments) {
    if (!ids.has(id)) {
      continue
    }
    if (executor === (EXPERIMENT_WORKSPACE_ID as Executor)) {
      return id
    }
  }
}

export const collectRemoteExpShas = (lsRemoteOutput: string): Set<string> => {
  const acc = new Set<string>()
  for (const shaAndRef of trimAndSplit(lsRemoteOutput)) {
    const [sha] = shaAndRef.split(/\s+/)
    acc.add(sha)
  }
  return acc
}
