import React from 'react'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import { update } from '../state/tableDataSlice'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { ExperimentsDispatch } from '../store'
import { dispatchAction } from '../../shared/dispatchAction'

const feedStore = (
  data: MessageToWebview<TableData>,
  dispatch: ExperimentsDispatch
) => {
  if (data?.type !== MessageToWebviewType.SET_DATA) {
    return
  }
  const stateUpdate = data?.data
  dispatch(update(!!stateUpdate))

  dispatchAction('experiments', stateUpdate, dispatch)
}

export const App: React.FC<Record<string, unknown>> = () => {
  useVsCodeMessaging(feedStore)

  return <Experiments />
}
