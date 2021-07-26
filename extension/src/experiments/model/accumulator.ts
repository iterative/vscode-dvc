import { ParamOrMetricAggregateData, Experiment } from '../webview/contract'
export interface PartialParamOrMetricDescriptor
  extends ParamOrMetricAggregateData {
  types: Set<string>
  hasChildren: boolean
  group: string
  path: string
  parentPath: string
}
export type PartialParamsOrMetricsMap = Map<
  string,
  PartialParamOrMetricDescriptor
>

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public metricsMap: PartialParamsOrMetricsMap = new Map()
  public paramsMap: PartialParamsOrMetricsMap = new Map()

  constructor(workspace?: Experiment) {
    if (workspace) {
      this.workspace = workspace
    }
  }
}
