import { ParamOrMetric } from '../../experiments/webview/contract'

export interface PlotsData {
  branchDisplayName: string
  branchId: string
  displayName: string
  experimentDisplayName: string
  experimentId: string
  iteration: number
  metrics: ParamOrMetric[]
  params: ParamOrMetric[]
}
