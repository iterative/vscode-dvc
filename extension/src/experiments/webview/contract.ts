import { Executor, ExecutorStatus, ValueTree } from '../../cli/dvc/contract'
import { SortDefinition } from '../model/sortBy'
export { ExecutorStatus } from '../../cli/dvc/contract'

export interface MetricOrParamColumns {
  [filename: string]: ValueTree
}

export interface ValueWithChanges {
  value: string | number
  changes: boolean
}

export interface DepColumns {
  [path: string]: ValueWithChanges
}

export type RunningExperiment = {
  executor: Executor
  id: string
}

export type CommitData = {
  author: string
  tags: string[]
  message: string
  date: string
}

export enum GitRemoteStatus {
  NOT_ON_REMOTE = 'not-on-remote',
  PUSHING = 'pushing',
  ON_REMOTE = 'on-remote'
}

export type Experiment = {
  commit?: CommitData
  Created?: string
  deps?: DepColumns
  displayColor?: string
  description?: string
  error?: string
  executor?: Executor
  id: string
  label: string
  metrics?: MetricOrParamColumns
  outs?: MetricOrParamColumns
  params?: MetricOrParamColumns
  gitRemoteStatus?: GitRemoteStatus
  selected?: boolean
  sha?: string
  starred?: boolean
  executorStatus?: ExecutorStatus
  timestamp?: string | null
  branch?: string | typeof WORKSPACE_BRANCH
}

export const isRunning = (
  executorStatus: ExecutorStatus | undefined
): boolean => executorStatus === ExecutorStatus.RUNNING

export const isQueued = (executorStatus: ExecutorStatus | undefined): boolean =>
  executorStatus === ExecutorStatus.QUEUED

export const isRunningInQueue = ({
  executorStatus,
  executor
}: {
  executorStatus?: ExecutorStatus
  executor?: string | null
}): boolean => isRunning(executorStatus) && executor === Executor.DVC_TASK

export interface Commit extends Experiment {
  subRows?: Experiment[]
}

export enum ColumnType {
  METRICS = 'metrics',
  PARAMS = 'params',
  DEPS = 'deps',
  TIMESTAMP = 'timestamp'
}

export type Column = {
  hasChildren: boolean
  label: string
  parentPath?: string
  path: string
  pathArray?: string[]
  type: ColumnType
  firstValueType?: string
  width?: number
}

export const WORKSPACE_BRANCH = null

export type TableData = {
  changes: string[]
  cliError: string | null
  columnOrder: string[]
  columns: Column[]
  columnWidths: Record<string, number>
  filters: string[]
  hasBranchesToSelect: boolean
  hasCheckpoints: boolean
  hasConfig: boolean
  hasMoreCommits: Record<string, boolean>
  hasRunningWorkspaceExperiment: boolean
  isStudioConnected: boolean
  isShowingMoreCommits: Record<string, boolean>
  rows: Commit[]
  showOnlyChanged: boolean
  selectedBranches: string[]
  selectedForPlotsCount: number
  sorts: SortDefinition[]
}

export type InitiallyUndefinedTableData = TableData | undefined
