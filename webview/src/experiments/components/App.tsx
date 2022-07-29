import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import { update } from './table/tableDataSlice'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC<Record<string, unknown>> = () => {
  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<TableData> }) => {
        if (data.type === MessageToWebviewType.SET_DATA) {
          dispatch(update(data.data))
        }
      },
      [dispatch]
    )
  )

  return <Experiments />
}
