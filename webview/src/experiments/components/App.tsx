import React, { useCallback, useState } from 'react'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import { vsCodeApi } from '../../shared/api'
import { useVsCodeMessages } from '../../shared/hooks/useVsCodeMessages'

export const App: React.FC<Record<string, unknown>> = () => {
  const [tableData, setTableData] = useState<TableData>()
  useVsCodeMessages(
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
