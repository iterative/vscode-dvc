import React, { useCallback } from 'react'
import { CombinedPlotsData } from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { Plots } from './Plots'
import { useAppReducer } from '../hooks/useAppReducer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App = () => {
  const [state, dispatch] = useAppReducer(undefined)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<CombinedPlotsData> }) => {
        dispatch(data)
      },
      [dispatch]
    )
  )

  return <Plots state={state} dispatch={dispatch} />
}
