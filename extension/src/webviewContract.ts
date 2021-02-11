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
  type: MessageFromWebviewType
}

export enum MessageFromWebviewType {
  initialized = 'initialized',
  onClickRunExperiment = 'onClickRunExperiment'
}

export type MessageToWebview = {
  errors?: Error[]
} & (
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
  setTheme = 'setTheme',
  showExperiments = 'showExperiments'
}
