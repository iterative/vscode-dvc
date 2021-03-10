import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'

import {
  DataDictRoot as DataDictRootT,
  ExperimentJSONOutput as ExperimentJSONOutputT,
  ExperimentsRepoJSONOutput as ExperimentsRepoJSONOutputT,
  MessageFromWebview as MessageFromWebviewT,
  MessageFromWebviewType,
  MessageToWebview as MessageToWebviewT,
  MessageToWebviewType,
  WebviewColorTheme,
  WindowWithWebviewData as WindowWithWebviewDataT
} from '../webviews/experiments/contract'

export { complexExperimentsOutput }

export type DataDictRoot = DataDictRootT
export type ExperimentJSONOutput = ExperimentJSONOutputT
export type ExperimentsRepoJSONOutput = ExperimentsRepoJSONOutputT
export type MessageFromWebview = MessageFromWebviewT
export type MessageToWebview = MessageToWebviewT
export type WindowWithWebviewData = WindowWithWebviewDataT

export { MessageFromWebviewType, MessageToWebviewType, WebviewColorTheme }

export { Logger } from '../Logger'
