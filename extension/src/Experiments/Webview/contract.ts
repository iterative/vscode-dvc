export const WebviewType = 'Experiments'

export interface WindowWithWebviewData {
  webviewData: {
    publicPath: string
    theme: WebviewColorTheme
  }
}

export enum WebviewColorTheme {
  light = 'light',
  dark = 'dark'
}

export type MessageFromWebview = {
  type: MessageFromWebviewType
}

export enum MessageFromWebviewType {
  initialized = 'initialized'
}

export type MessageToWebview = {
  errors?: Error[]
} & (
  | {
      type: MessageToWebviewType.setDvcRoot
      dvcRoot: string
    }
  | {
      type: MessageToWebviewType.setTheme
      theme: WebviewColorTheme
    }
  | {
      type: MessageToWebviewType.showExperiments
      tableData?: ExperimentsRepoJSONOutput | null
    }
)

export enum MessageToWebviewType {
  setDvcRoot = 'setDvcRoot',
  setTheme = 'setTheme',
  showExperiments = 'showExperiments'
}

interface DataDict {
  [name: string]: string | number | DataDict
}
export interface DataDictRoot {
  [filename: string]: DataDict
}

export interface ExperimentJSONOutput {
  name?: string
  timestamp?: string | Date | null
  params?: DataDictRoot
  metrics?: DataDictRoot
  queued?: boolean
  checkpoint_tip?: string
  checkpoint_parent?: string
}

interface ExperimentsCommitJSONOutput
  extends Record<string, ExperimentJSONOutput> {
  baseline: ExperimentJSONOutput
}

interface ExperimentsCommitJSONOutput
  extends Record<string, ExperimentJSONOutput> {
  baseline: ExperimentJSONOutput
}

export interface ExperimentsRepoJSONOutput
  extends Record<string, ExperimentsCommitJSONOutput> {
  workspace: ExperimentsCommitJSONOutput
}

export interface ExperimentsWebviewState {
  dvcRoot: string
  experiments?: ExperimentsRepoJSONOutput
}
