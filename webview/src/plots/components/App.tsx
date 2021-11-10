import React, { useEffect } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'
import { PlotsWebviewState, useAppReducer } from '../hooks/useAppReducer'

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.initialized })

export const App = () => {
  const [state, dispatch] = useAppReducer(
    vsCodeApi.getState<PlotsWebviewState>()
  )

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
  }, [dispatch])
  useEffect(() => {
    vsCodeApi.setState<PlotsWebviewState>(state)
  }, [state])

  return <Plots state={state} dispatch={dispatch} />
}
