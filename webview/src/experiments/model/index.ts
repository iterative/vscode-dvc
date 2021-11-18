import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebviewType,
  MessageToWebview as GenericMessageToWebview,
  WebviewColorTheme,
  WindowWithWebviewData
} from 'dvc/src/webview/contract'
import { ColumnDetail, TableData } from 'dvc/src/experiments/webview/contract'
import { Logger } from 'dvc/src/common/logger'
import { autorun, makeObservable, observable, runInAction } from 'mobx'
import { Disposable } from '@hediet/std/disposable'

import { addMessageHandler } from './window'
import { vsCodeApi } from '../../shared/api'

type MessageToWebview = GenericMessageToWebview<TableData>

declare const window: Window & WindowWithWebviewData

interface PersistedModelState {
  data?: TableData | null
  dvcRoot?: string
}

export class Model {
  @observable
  public theme: WebviewColorTheme = WebviewColorTheme.light

  @observable
  public data?: TableData | null = null // do not remove = null or webview will not load data

  @observable
  public dvcRoot?: string

  public readonly dispose = Disposable.fn()

  constructor(
    initialState: PersistedModelState = vsCodeApi.getState<PersistedModelState>()
  ) {
    makeObservable(this)
    const data = window.webviewData
    this.theme = data?.theme

    this.dispose.track(
      addMessageHandler<MessageToWebview>(message =>
        this.handleMessage(message)
      )
    )

    if (initialState) {
      this.setState(initialState)
    }

    this.sendMessage({ type: MessageFromWebviewType.initialized })

    this.dispose.track({
      dispose: autorun(() => {
        vsCodeApi.setState(this.getState())
      })
    })
  }

  public sendMessage(message: MessageFromWebview): void {
    vsCodeApi.postMessage(message)
  }

  public getColumnsWithWidth(): ColumnDetail[] {
    return this.data?.columnsOrder || []
  }

  public setColumnWidth(id: string, width: number) {
    const column = this.data?.columnsOrder.find(column => column.path === id)
    if (column) {
      column.width = width
      this.sendMessage({
        payload: { id, width },
        type: MessageFromWebviewType.columnResized
      })
    }
  }

  public sendColumnsOrder(newOrder: string[]): void {
    this.sendMessage({
      payload: newOrder,
      type: MessageFromWebviewType.columnReordered
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
      case MessageToWebviewType.setTheme:
        runInAction(() => {
          this.theme = message.theme
        })
        return
      case MessageToWebviewType.setData:
        runInAction(() => {
          this.data = message.data
        })
        return
      case MessageToWebviewType.setDvcRoot:
        runInAction(() => {
          this.dvcRoot = message.dvcRoot
        })
        return
      default:
        Logger.error(`Unexpected message: ${message}`)
    }
  }
}
