import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebviewType,
  MessageToWebview as GenericMessageToWebview,
  WebviewColorTheme,
  WindowWithWebviewData
} from 'dvc/src/webview/contract'
import {
  ColumnOrder,
  ParamOrMetric,
  TableData
} from 'dvc/src/experiments/webview/contract'
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
  private static instance: Model

  @observable
  public theme: WebviewColorTheme = WebviewColorTheme.light

  @observable
  public data?: TableData | null = null // do not remove = null or webview will not load data

  @observable
  public dvcRoot?: string

  public readonly dispose = Disposable.fn()

  public errors?: Array<Error | string> = undefined

  public columnsOrderRepresentation: ParamOrMetric[] = []

  private constructor() {
    makeObservable(this)
    const data = window.webviewData
    this.theme = data.theme

    this.dispose.track(
      addMessageHandler<MessageToWebview>(message =>
        this.handleMessage(message)
      )
    )

    const state = vsCodeApi.getState<PersistedModelState>()

    if (state) {
      this.setState(state)
    }

    this.sendMessage({ type: MessageFromWebviewType.initialized })

    this.dispose.track({
      dispose: autorun(() => {
        vsCodeApi.setState(this.getState())
      })
    })
  }

  public static getInstance(): Model {
    if (!Model.instance) {
      Model.instance = new Model()
    }
    return Model.instance
  }

  public sendMessage(message: MessageFromWebview): void {
    vsCodeApi.postMessage(message)
  }

  public getColumnsWithWidth(): ColumnOrder[] {
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

  public createColumnsOrderRepresentation(newOrder?: string[]) {
    if (newOrder) {
      this.sendMessage({
        payload: this.getOrderFromPaths(newOrder),
        type: MessageFromWebviewType.columnReordered
      })
    }

    this.columnsOrderRepresentation = this.getOrderedDataWithGroups(newOrder)
  }

  private getOrderFromPaths(paths: string[]): ColumnOrder[] {
    return this.data?.columnsOrder?.length
      ? (paths
          .map(path =>
            this.data?.columnsOrder.find(column => column.path === path)
          )
          .filter(Boolean) as ColumnOrder[])
      : paths.map(path => ({ path, width: 0 }))
  }

  private getOrderedPaths(newOrder?: string[]): string[] {
    if (newOrder) {
      return newOrder
    }

    return (
      (this.data?.columnsOrder &&
        this.data.columnsOrder
          .map(column => column.path)
          .filter(column => !['experiment', 'timestamp'].includes(column))) ||
      []
    )
  }

  private getOrderedData(newOrder?: string[]): ParamOrMetric[] {
    const orderedPaths = this.getOrderedPaths(newOrder)
    return orderedPaths
      .map(path => ({
        ...this.data?.columns.find(column => column.path === path)
      }))
      .filter(Boolean) as ParamOrMetric[]
  }

  private getOrderedDataWithGroups(newOrder?: string[]): ParamOrMetric[] {
    const orderedData = [...this.getOrderedData(newOrder)]
    const previousGroups: string[] = []

    let previousGroup = (orderedData?.length && orderedData[0].parentPath) || ''

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
        orderedData.push(parentNode as ParamOrMetric)
      }
    })
    return orderedData
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
