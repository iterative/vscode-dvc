import { MessageFromWebviewType } from 'dvc/src/experiments/webview/contract'
import React, { useEffect } from 'react'
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
  useEffect(() => {
    vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })
    vsCodeApi.setState({
      state: true
    })
  }, [])
  return <div>Plots!</div>
}

const elem = document.createElement('div')
elem.className = 'react-root'
document.body.append(elem)
ReactDOM.render(<App />, elem)
