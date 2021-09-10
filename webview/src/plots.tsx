import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/experiments/webview/contract'
import React, { useEffect, useState } from 'react'
import * as ReactDOM from 'react-dom'
import './style.scss'

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

interface InternalVsCodeApi {
  getState<T>(): T
  setState<T>(state: T): void
  postMessage<T>(message: T): void
}

const vsCodeApi = acquireVsCodeApi()

const App = () => {
  const [tableData, setTableData] = useState()
  const [dvcRoot, setDvcRoot] = useState()
  useEffect(() => {
    vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })
    window.addEventListener('message', e => {
      const { data } = e
      switch (data.type) {
        case MessageToWebviewType.showExperiments: {
          setTableData(data.tableData)
          return
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
      tableData
    })
  }, [tableData, dvcRoot])
  return (
    <>
      <div>Plots!</div>
      <pre>{JSON.stringify(tableData, undefined, 2)}</pre>
    </>
  )
}

const elem = document.createElement('div')
elem.className = 'react-root'
document.body.append(elem)
ReactDOM.render(<App />, elem)
