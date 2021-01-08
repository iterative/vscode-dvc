import { DVCExperimentsRepoJSONOutput } from './DvcReader'

export interface WindowWithWebviewData {
  webviewData: {
    publicPath: string
    theme: 'light' | 'dark'
  }
}

// Use union type to add more messages

export type MessageFromWebview = {
  kind: 'initialized' | 'onClickRunExperiment'
}

export type MessageToWebview = {
  errors?: Error[]
} & (
  | {
      kind: 'setTheme'
      theme: 'light' | 'dark'
    }
  | {
      kind: 'showExperiments'
      tableData?: DVCExperimentsRepoJSONOutput | null
    }
)
