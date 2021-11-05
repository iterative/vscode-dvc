import React, { useEffect, useState } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import Plots from './Plots'
import { vsCodeApi } from '../util/vscode'

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })

export const App = () => {
  const [plotsData, setPlotsData] = useState<PlotsData>()
  const [dvcRoot, setDvcRoot] = useState<string>()
  useEffect(() => {
    const messageListener = ({
      data
    }: {
      data: MessageToWebview<PlotsData>
    }) => {
      switch (data.type) {
        case MessageToWebviewType.setData: {
          setPlotsData(data.data)
          break
        }
        case MessageToWebviewType.setDvcRoot: {
          setDvcRoot(data.dvcRoot)
        }
      }
    }
    window.addEventListener('message', messageListener)
    signalInitialized()
    return () => window.removeEventListener('message', messageListener)
  }, [])
  useEffect(() => {
    vsCodeApi.setState({
      data: plotsData,
      dvcRoot
    })
  }, [plotsData, dvcRoot])
  return <Plots plotsData={plotsData} />
}
