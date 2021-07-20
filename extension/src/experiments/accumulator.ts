import { ColumnAggregateData, Experiment } from './webview/contract'
export interface PartialColumnDescriptor extends ColumnAggregateData {
  types?: Set<string>
  hasChildren: boolean
  group: string
  path: string
  parentPath: string
}
export type PartialColumnsMap = Map<string, PartialColumnDescriptor>

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public metricsMap: PartialColumnsMap = new Map()
  public paramsMap: PartialColumnsMap = new Map()

  constructor(workspace?: Experiment) {
    if (workspace) {
      this.workspace = workspace
    }
  }
}
