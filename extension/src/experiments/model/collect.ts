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
  PushedStatus,
  RunningExperiment,
  isQueued,
  isRunning
} from '../webview/contract'
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

const collectCommitData = (
  acc: { [sha: string]: CommitData },
  commit: string
) => {
  const [sha, author, date, refNamesWithKey] = commit
    .split('\n')
    .filter(Boolean)

  if (!sha) {
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
  const lines = commit.split('\n').filter(Boolean)
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

  if (name && state === ExperimentStatus.RUNNING) {
    experiment.executor = name
  }
  if (state && state !== ExperimentStatus.SUCCESS) {
    experiment.status = state
  }
}

const collectRemoteStatus = (
  experiment: Experiment,
  remoteExpShas: Set<string>
): void => {
  if (
    !experiment.sha ||
    ![undefined, ExperimentStatus.SUCCESS].includes(experiment.status)
  ) {
    return
  }
  experiment.pushed = remoteExpShas.has(experiment.sha)
    ? PushedStatus.ON_REMOTE
    : PushedStatus.NOT_ON_REMOTE
}

const collectRunningExperiment = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
): void => {
  if (!isRunning(experiment.status)) {
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
  expRange: ExpRange,
  remoteExpShas: Set<string>
): void => {
  const { revs, executor } = expRange
  if (!revs?.length) {
    return
  }
  const expState = revs[0]

  const { name, rev } = expState
  const { id: baselineId } = baseline

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

  collectExecutorInfo(experiment, executor)
  collectRemoteStatus(experiment, remoteExpShas)
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
    acc.workspace.status = ExperimentStatus.RUNNING
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

const collectRemoteExpShas = (remoteExpRefs: string): Set<string> => {
  const remoteExpShas = new Set<string>()
  for (const ref of trimAndSplit(remoteExpRefs)) {
    const [sha] = ref.split(/\s/)
    remoteExpShas.add(sha)
  }
  return remoteExpShas
}

export const collectExperiments = (
  expShow: ExpShowOutput,
  gitLog: string,
  dvcLiveOnly: boolean,
  remoteExpRefs = ''
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
  const remoteExpShas = collectRemoteExpShas(remoteExpRefs)

  for (const expState of expShow) {
    const baseline = collectExpState(acc, expState, commitData)
    const { experiments } = expState

    if (!(baseline && experiments?.length)) {
      continue
    }

    for (const expRange of experiments) {
      collectExpRange(acc, baseline, expRange, remoteExpShas)
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
    if (isQueued(experiment.status)) {
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

export const isCurrentBranch = (branch: string) => branch.indexOf('*') === 0

export const collectBranches = (
  allBranches: string[]
): { currentBranch: string; branches: string[] } => {
  let currentBranch = ''
  const branches: string[] = []

  for (const branch of allBranches) {
    const isCurrent = isCurrentBranch(branch)

    const cleanBranch = branch
      .replace('* ', '')
      .replace(/\(HEAD\s\w+\s\w+\s/, '')
      .replace(')', '')

    if (!currentBranch && isCurrent) {
      currentBranch = cleanBranch
    }

    branches.push(cleanBranch)
  }

  return { branches, currentBranch }
}
