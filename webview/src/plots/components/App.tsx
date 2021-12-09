import React, { useCallback, useEffect } from 'react'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'
import { PlotsWebviewState, useAppReducer } from '../hooks/useAppReducer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App = () => {
  const [state, dispatch] = useAppReducer(
    vsCodeApi.getState<PlotsWebviewState>()
  )

  useVsCodeMessaging(
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

  return <Plots state={state} dispatch={dispatch} />
}
