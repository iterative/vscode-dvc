import React, { useEffect, useState } from 'react'
import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'

import { ValueTreeRoot } from 'dvc/src/cli/reader'
import Plots from './Plots'
import { InternalVsCodeApi } from '../../shared/api'
import parseTableData from '../parse-table-data'

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
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

export interface PlotsData {
  columns: ParamOrMetric[]
  items: PlotItem[]
}

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })

const App = () => {
  const [plotsData, setPlotsData] = useState<PlotsData>()
  const [dvcRoot, setDvcRoot] = useState()
  useEffect(() => {
    signalInitialized()
    window.addEventListener('message', ({ data }) => {
      switch (data.type) {
        case MessageToWebviewType.setData: {
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
