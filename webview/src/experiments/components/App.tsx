import React, { useEffect, useState } from 'react'
import {
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import { vsCodeApi } from '../../shared/api'

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.INITIALIZED })

export const App: React.FC<Record<string, unknown>> = () => {
  const [tableData, setTableData] = useState<TableData>()
  useEffect(() => {
    signalInitialized()
  }, [])
  useEffect(() => {
    const messageListener = ({
      data
    }: {
      data: MessageToWebview<TableData>
    }) => {
      switch (data.type) {
        case MessageToWebviewType.SET_DATA:
          setTableData(data.data)
          return
        case MessageToWebviewType.SET_DVC_ROOT:
          vsCodeApi.setState({ dvcRoot: data.dvcRoot })
      }
    }
    window.addEventListener('message', messageListener)
    return () => window.removeEventListener('message', messageListener)
  }, [setTableData])

  return <Experiments tableData={tableData} />
}
