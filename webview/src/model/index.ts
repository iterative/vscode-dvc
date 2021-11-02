import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebviewType,
  MessageToWebview as GenericMessageToWebview,
  WebviewColorTheme,
  WindowWithWebviewData
} from 'dvc/src/webview/contract'
import { ParamOrMetric, TableData } from 'dvc/src/experiments/webview/contract'
import { Logger } from 'dvc/src/common/logger'
import { autorun, makeObservable, observable, runInAction } from 'mobx'
import { Disposable } from '@hediet/std/disposable'

import { getVsCodeApi, VsCodeApi as BaseVsCodeApi } from './vsCodeApi'

type MessageToWebview = GenericMessageToWebview<TableData>

export type VsCodeApi = BaseVsCodeApi<
  PersistedModelState,
  MessageFromWebview,
  MessageToWebview
>

declare const window: Window & WindowWithWebviewData
/* eslint-disable @typescript-eslint/no-unused-vars */
declare let __webpack_public_path__: string

interface PersistedModelState {
  data?: TableData | null
  dvcRoot?: string
}

export class Model {
  private static instance: Model

  @observable
  public theme: WebviewColorTheme = WebviewColorTheme.light

  @observable
  public data?: TableData | null = null // do not remove = null or webview will not load data

  @observable
  public dvcRoot?: string

  public readonly dispose = Disposable.fn()

  public readonly vsCodeApi = getVsCodeApi<
    PersistedModelState,
    MessageFromWebview,
    MessageToWebview
  >()

  public errors?: Array<Error | string> = undefined

  public columnsOrderRepresentation: ParamOrMetric[] = []

  private constructor() {
    makeObservable(this)
    const data = window.webviewData
    this.theme = data.theme

    this.dispose.track(
      this.vsCodeApi.addMessageHandler(message => this.handleMessage(message))
    )

    const state = this.vsCodeApi.getState()

    if (state) {
      this.setState(state)
    }

    this.sendMessage({ type: MessageFromWebviewType.initialized })

    this.dispose.track({
      dispose: autorun(() => {
        this.vsCodeApi.setState(this.getState())
      })
    })
  }

  public static getInstance(): Model {
    if (!Model.instance) {
      Model.instance = new Model()
    }
    return Model.instance
  }

  public createColumnsOrderRepresentation(newOrder?: string[]) {
    if (newOrder) {
      this.sendMessage({
        payload: newOrder,
        type: MessageFromWebviewType.columnReordered
      })
    }
    const orderedPaths: string[] =
      newOrder ||
      (this.data?.columnsOrder?.length && this.data.columnsOrder.slice(2)) ||
      []

    const previousGroups: string[] = []
    const orderedData = [
      ...orderedPaths
        .map(path => ({
          ...this.data?.columns.find(column => column.path === path)
        }))
        .filter(Boolean)
    ]

    if (!orderedData.length) {
      return
    }

    let previousGroup = orderedData[0].parentPath || ''

    orderedData.forEach(node => {
      const { parentPath, path } = node

      if (parentPath !== previousGroup) {
        previousGroups.push(previousGroup)
        previousGroup = parentPath || ''
      }

      const groupNumberPrefix = `${previousGroups.length}/`

      node.path = groupNumberPrefix + path
      node.parentPath = groupNumberPrefix + parentPath

      const parentNode = {
        ...this.data?.columns.find(column => column.path === parentPath)
      }
      parentNode.path = groupNumberPrefix + parentPath

      if (!orderedData.find(column => column.path === parentNode.path)) {
        orderedData.push(parentNode)
      }
    })
    this.columnsOrderRepresentation = orderedData as ParamOrMetric[]
  }

  private sendMessage(message: MessageFromWebview): void {
    this.vsCodeApi.postMessage(message)
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
    this.createColumnsOrderRepresentation()
  }

  private handleMessage(message: MessageToWebview): void {
    this.errors = message.errors || undefined
    switch (message.type) {
      case MessageToWebviewType.setTheme:
        runInAction(() => {
          this.theme = message.theme
        })
        return
      case MessageToWebviewType.setData:
        runInAction(() => {
          this.data = message.data
          this.createColumnsOrderRepresentation()
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
