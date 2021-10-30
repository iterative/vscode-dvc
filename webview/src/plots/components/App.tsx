import React, { useEffect, useState } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import Plots from './Plots'
import { InternalVsCodeApi } from '../../shared/api'

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

const vsCodeApi = acquireVsCodeApi()

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
          setPlotsData(data.data)
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
      data: plotsData,
      dvcRoot
    })
  }, [plotsData, dvcRoot])
  return <Plots plotsData={plotsData} />
}

export default App
