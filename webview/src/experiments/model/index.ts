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
  data?: TableData | null
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

  public persistColumnWidth(id: string, width: number) {
    const originalState = this.getState()
    const data = originalState.data as TableData
    const { columnWidths = {} } = data
    vsCodeApi.setState({
      ...originalState,
      data: {
        ...data,
        columnWidths: {
          ...(columnWidths || {}),
          [id]: width
        }
      }
    })
    this.sendMessage({
      payload: { id, width },
      type: MessageFromWebviewType.COLUMN_RESIZED
    })
  }

  public persistColumnsOrder(newOrder: string[]): void {
    const originalState = this.getState()
    const data = originalState.data as TableData
    vsCodeApi.setState({
      ...originalState,
      data: {
        ...data,
        columnOrder: newOrder
      }
    })
    this.sendMessage({
      payload: newOrder,
      type: MessageFromWebviewType.COLUMN_REORDERED
    })
  }

  private getState(): PersistedModelState {
    return {
      data: this.data,
      dvcRoot: this.dvcRoot
    }
  }

  private setState(state: PersistedModelState) {
    this.dvcRoot = state.dvcRoot
    this.data = state.data
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
        return
      default:
        Logger.error(`Unexpected message: ${message}`)
    }
  }
}
