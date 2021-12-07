import React, { useCallback, useEffect } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import { MessageFromWebview, MessageToWebview } from 'dvc/src/webview/contract'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'
import { PlotsWebviewState, useAppReducer } from '../hooks/useAppReducer'
import { useVsCodeMessages } from '../../shared/hooks/useVsCodeMessages'

const sendMessage = (message: MessageFromWebview) =>
  vsCodeApi.postMessage(message)

export const App = () => {
  const [state, dispatch] = useAppReducer(
    vsCodeApi.getState<PlotsWebviewState>()
  )

  useVsCodeMessages(
    useCallback(
      ({ data }: { data: MessageToWebview<PlotsData> }) => {
        dispatch(data)
      },
      [dispatch]
    )
  )

  useEffect(() => {
    vsCodeApi.setState<PlotsWebviewState>(state)
  }, [state])

  return <Plots state={state} dispatch={dispatch} sendMessage={sendMessage} />
}
