import { ExperimentsRepoJSONOutput } from './DvcReader'

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
  kind: MessageFromWebviewKind
}

export enum MessageFromWebviewKind {
  initialized = 'initialized',
  onClickRunExperiment = 'onClickRunExperiment'
}

export type MessageToWebview = {
  errors?: Error[]
} & (
  | {
      kind: MessageToWebviewKind.setTheme
      theme: WebviewColorTheme
    }
  | {
      kind: MessageToWebviewKind.showExperiments
      tableData?: ExperimentsRepoJSONOutput | null
    }
)

export enum MessageToWebviewKind {
  setTheme = 'setTheme',
  showExperiments = 'showExperiments'
}
