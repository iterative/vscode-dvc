import React, { useCallback, useState } from 'react'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import { vsCodeApi } from '../../shared/api'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC<{ initialData?: TableData }> = ({ initialData }) => {
  const [tableData, setTableData] = useState<TableData | undefined>(initialData)
  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<TableData> }) => {
        switch (data.type) {
          case MessageToWebviewType.SET_DATA:
            setTableData(data.data)
            return
          case MessageToWebviewType.SET_DVC_ROOT:
            vsCodeApi.setState({ dvcRoot: data.dvcRoot })
        }
      },
      [setTableData]
    )
  )

  return <Experiments tableData={tableData} />
}
