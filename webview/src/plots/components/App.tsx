import React, { Reducer, useEffect, useReducer } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })

interface PlotsWebviewState {
  data?: PlotsData
  dvcRoot?: string
}

const plotsAppReducer: Reducer<
  PlotsWebviewState,
  MessageToWebview<PlotsData>
> = (state, action) => {
  switch (action.type) {
    case MessageToWebviewType.setData:
      return {
        ...state,
        data: action.data
      }
    case MessageToWebviewType.setDvcRoot:
      return {
        ...state,
        dvcRoot: action.dvcRoot
      }
    default:
      return state
  }
}

export const App = () => {
  const [state, dispatch] = useReducer(
    plotsAppReducer,
    vsCodeApi.getState<PlotsWebviewState>() || {}
  )
  const { data } = state

  useEffect(() => {
    const messageListener = ({
      data
    }: {
      data: MessageToWebview<PlotsData>
    }) => {
      dispatch(data)
    }
    window.addEventListener('message', messageListener)
    signalInitialized()
    return () => window.removeEventListener('message', messageListener)
  }, [])
  useEffect(() => {
    vsCodeApi.setState<PlotsWebviewState>(state)
  }, [state])
  return <Plots plotsData={data} />
}
