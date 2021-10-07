import React, { useEffect, useState } from 'react'
import {
  MessageFromWebviewType,
  MessageToWebviewType,
  RowData,
  ParamOrMetric,
  TableData
} from 'dvc/src/experiments/webview/contract'

import { ValueTreeRoot } from 'dvc/src/cli/reader'
import Plots from './Plots'

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

export interface InternalVsCodeApi {
  getState<T>(): T
  setState<T>(state: T): void
  postMessage<T>(message: T): void
}

const vsCodeApi = acquireVsCodeApi()

export interface PlotItem {
  experimentDisplayName: string
  experimentId: string
  branchDisplayName: string
  branchId: string
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
  iteration?: number
  displayName: string
}

export const parseRows = (rows: RowData[]): PlotItem[] => {
  const items: PlotItem[] = []
  rows
    .reverse()
    .forEach(
      ({
        displayName: branchDisplayName,
        id: branchId,
        subRows: experiments
      }) => {
        experiments
          ?.reverse()
          .forEach(
            ({
              subRows: checkpoints,
              id: experimentId,
              displayName: experimentDisplayName
            }) => {
              if (checkpoints && checkpoints.length > 0) {
                checkpoints
                  .reverse()
                  .forEach(({ params, metrics, displayName }, i) => {
                    items.push({
                      branchDisplayName,
                      branchId,
                      displayName,
                      experimentDisplayName,
                      experimentId,
                      iteration: checkpoints.length - i,
                      metrics,
                      params
                    })
                  })
              }
            }
          )
      }
    )
  return items
}

export interface PlotsData {
  columns: ParamOrMetric[]
  items: PlotItem[]
}

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })

export const parseTableData = (tableData: TableData) => {
  if (tableData) {
    const { rows, columns } = tableData
    return { columns, items: parseRows(rows) }
  } else {
    return undefined
  }
}

const App = () => {
  const [plotsData, setPlotsData] = useState<PlotsData>()
  const [dvcRoot, setDvcRoot] = useState()
  useEffect(() => {
    signalInitialized()
    window.addEventListener('message', ({ data }) => {
      switch (data.type) {
        case MessageToWebviewType.showExperiments: {
          setPlotsData(parseTableData(data.tableData))
          break
        }
        case MessageToWebviewType.setDvcRoot: {
          setDvcRoot(data.dvcRoot)
        }
      }
    })
  }, [])
  useEffect(() => {
    vsCodeApi.setState({
      dvcRoot,
      plotsData
    })
  }, [plotsData, dvcRoot])
  return <Plots plotsData={plotsData} />
}

export default App
