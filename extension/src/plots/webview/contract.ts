import { WebviewState as GenericWebviewState } from '../../webview/contract'
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

export type WebviewState = GenericWebviewState<PlotsData>
