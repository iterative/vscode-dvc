import React, { useCallback } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import { MessageFromWebview, MessageToWebview } from 'dvc/src/webview/contract'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'
import { useAppReducer } from '../hooks/useAppReducer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

const sendMessage = (message: MessageFromWebview) =>
  vsCodeApi.postMessage(message)

export const App = () => {
  const [state, dispatch] = useAppReducer(undefined)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<PlotsData> }) => {
        dispatch(data)
      },
      [dispatch]
    )
  )

  return <Plots state={state} dispatch={dispatch} sendMessage={sendMessage} />
}
