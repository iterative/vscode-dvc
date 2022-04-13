import React, { useCallback, useState } from 'react'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC<Record<string, unknown>> = () => {
  const [tableData, setTableData] = useState<TableData>()
  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<TableData> }) => {
        if (data.type === MessageToWebviewType.SET_DATA) {
          setTableData(data.data)
        }
      },
      [setTableData]
    )
  )

  return <Experiments tableData={tableData} />
}
