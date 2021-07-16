import { ColumnAggregateData, Experiment } from './webview/contract'
import { ExperimentsBranchJSONOutput } from '../cli/reader'

export enum RowStatus {
  RUNNING = 'running',
  QUEUED = 'queued'
}

export type RunningOrQueued = { status: RowStatus; children?: string[] }

export interface PartialColumnDescriptor extends ColumnAggregateData {
  types?: Set<string>
  hasChildren: boolean
  group: string
  path: string
  parentPath: string
}
export type PartialColumnsMap = Map<string, PartialColumnDescriptor>

export class ExperimentsAccumulator {
  public workspace: Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public metricsMap: PartialColumnsMap = new Map()
  public paramsMap: PartialColumnsMap = new Map()
  public runningOrQueued: Map<string, RunningOrQueued & { id?: string }> =
    new Map()

  constructor(workspace: ExperimentsBranchJSONOutput) {
    this.workspace = {
      ...workspace.baseline,
      displayName: 'workspace',
      id: 'workspace'
    }

    if (workspace.baseline.running) {
      this.runningOrQueued.set('workspace', {
        status: RowStatus.RUNNING
      })
    }
  }
}
