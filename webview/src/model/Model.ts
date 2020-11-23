import {
  MessageFromWebview,
  MessageToWebview,
  WindowWithWebviewData
} from 'dvc-integration/src/webviewContract'
import { observable, autorun } from 'mobx'
import { Disposable } from '@hediet/std/disposable'
import { DVCExperimentsRepoJSONOutput } from 'dvc-integration/src/DvcReader'
import { getVsCodeApi } from './VsCodeApi'

declare const window: Window & WindowWithWebviewData
/* eslint-disable @typescript-eslint/no-unused-vars */
declare let __webpack_public_path__: string

interface PersistedModelState {
  experiments?: DVCExperimentsRepoJSONOutput | null
}

export class Model {
  public readonly dispose = Disposable.fn()

  @observable
  public theme: 'dark' | 'light' = 'light'

  @observable
  public experiments?: DVCExperimentsRepoJSONOutput | null = null

  private readonly vsCodeApi = getVsCodeApi<
    PersistedModelState,
    MessageFromWebview,
    MessageToWebview
  >()

  public errors?: Array<Error | string> = undefined

  constructor() {
    const data = window.webviewData

    // this needs to be setup so that dynamic imports work
    __webpack_public_path__ = data.publicPath
    this.theme = data.theme

    this.dispose.track(
      this.vsCodeApi.addMessageHandler(message => this.handleMessage(message))
    )

    const state = this.vsCodeApi.getState()
    if (state) {
      this.setState(state)
    }

    this.sendMessage({ kind: 'initialized' })

    this.dispose.track({
      dispose: autorun(() => {
        console.log(this.getState())
        this.vsCodeApi.setState(this.getState())
      })
    })
  }

  private getState(): PersistedModelState {
    return {
      experiments: this.experiments
    }
  }

  private setState(state: PersistedModelState) {
    this.experiments = state.experiments
  }

  private sendMessage(message: MessageFromWebview): void {
    this.vsCodeApi.postMessage(message)
  }

  private handleMessage(message: MessageToWebview): void {
    this.errors = message.errors || undefined
    switch (message.kind) {
      case 'setTheme':
        this.theme = message.theme
        return
      case 'showExperiments':
        this.experiments = message.tableData
        return
      default:
        // eslint-disable-next-line
        const nvr: never = message
        console.error('Unexpected message', message)
    }
  }
}
