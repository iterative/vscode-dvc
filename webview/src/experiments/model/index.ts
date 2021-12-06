import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebviewType,
  MessageToWebview as GenericMessageToWebview
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import { Logger } from 'dvc/src/common/logger'
import { autorun, makeObservable, observable, runInAction } from 'mobx'
import { Disposable } from '@hediet/std/disposable'

import { addMessageHandler } from './window'
import { vsCodeApi } from '../../shared/api'

type MessageToWebview = GenericMessageToWebview<TableData>

interface PersistedModelState {
  dvcRoot?: string
}

export class Model {
  @observable
  public data?: TableData | null = null // do not remove = null or webview will not load data

  @observable
  public dvcRoot?: string

  public readonly dispose = Disposable.fn()

  constructor(
    initialState: PersistedModelState = vsCodeApi.getState<PersistedModelState>()
  ) {
    makeObservable(this)

    this.dispose.track(
      addMessageHandler<MessageToWebview>(message =>
        this.handleMessage(message)
      )
    )

    if (initialState) {
      this.setState(initialState)
    }

    this.sendMessage({ type: MessageFromWebviewType.INITIALIZED })

    this.dispose.track({
      dispose: autorun(() => {
        vsCodeApi.setState(this.getState())
      })
    })
  }

  public sendMessage(message: MessageFromWebview): void {
    vsCodeApi.postMessage(message)
  }

  private getState(): PersistedModelState {
    return {
      dvcRoot: this.dvcRoot
    }
  }

  private setState(state: PersistedModelState) {
    this.dvcRoot = state.dvcRoot
  }

  private handleMessage(message: MessageToWebview): void {
    switch (message.type) {
      case MessageToWebviewType.SET_DATA:
        runInAction(() => {
          this.data = message.data
        })
        return
      case MessageToWebviewType.SET_DVC_ROOT:
        runInAction(() => {
          this.dvcRoot = message.dvcRoot
        })
        vsCodeApi.setState({ dvcRoot: this.dvcRoot })
        return
      default:
        Logger.error(`Unexpected message: ${message}`)
    }
  }
}
