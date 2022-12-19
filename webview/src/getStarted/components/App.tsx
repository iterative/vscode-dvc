import { GetStartedData } from 'dvc/src/getStarted/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import React, { useCallback, useState } from 'react'
import { CliUnavailable } from './CliUnavailable'
import { ProjectUninitialized } from './ProjectUninitialized'
import { NoData } from './NoData'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'

export const App: React.FC = () => {
  const [cliAvailable, setCliAvailable] = useState(false)
  const [projectInitialized, setProjectInitialized] = useState(false)
  const [hasData, setHasData] = useState(false)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<GetStartedData> }) => {
        setCliAvailable(data.data.cliAccessible)
        setProjectInitialized(data.data.projectInitialized)
        setHasData(data.data.hasData)
      },
      [setCliAvailable, setProjectInitialized]
    )
  )

  const initializeProject = () => {
    sendMessage({
      type: MessageFromWebviewType.INITIALIZE_PROJECT
    })
  }

  if (!cliAvailable) {
    return <CliUnavailable />
  }

  if (!projectInitialized) {
    return <ProjectUninitialized initializeProject={initializeProject} />
  }

  if (!hasData) {
    return <NoData />
  }

  return null
}
