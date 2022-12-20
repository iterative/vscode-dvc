import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { GetStartedData } from 'dvc/src/getStarted/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import React, { useCallback, useState } from 'react'
import { CliUnavailable } from './CliUnavailable'
import { ProjectUninitialized } from './ProjectUninitialized'
import { NoData } from './NoData'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'

export const App: React.FC = () => {
  const [cliAvailable, setCliAvailable] = useState<boolean>(false)
  const [projectInitialized, setProjectInitialized] = useState<boolean>(false)
  const [pythonBinPath, setPythonBinPath] = useState<string | undefined>(
    undefined
  )
  const [isPythonExtensionUsed, setIsPythonExtensionUsed] =
    useState<boolean>(false)
  const [hasData, setHasData] = useState(false)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<GetStartedData> }) => {
        setCliAvailable(data.data.cliAccessible)
        setIsPythonExtensionUsed(data.data.isPythonExtensionUsed)
        setProjectInitialized(data.data.projectInitialized)
        setPythonBinPath(data.data.pythonBinPath)
        setHasData(data.data.hasData)
      },
      [
        setCliAvailable,
        setIsPythonExtensionUsed,
        setProjectInitialized,
        setPythonBinPath,
        setHasData
      ]
    )
  )

  const initializeProject = () => {
    sendMessage({
      type: MessageFromWebviewType.INITIALIZE_PROJECT
    })
  }

  const openExperiments = () => {
    sendMessage({
      type: MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW
    })
  }

  if (!cliAvailable) {
    return (
      <CliUnavailable
        isPythonExtensionUsed={isPythonExtensionUsed}
        pythonBinPath={pythonBinPath}
      />
    )
  }

  if (!projectInitialized) {
    return <ProjectUninitialized initializeProject={initializeProject} />
  }

  if (!hasData) {
    return <NoData />
  }

  return (
    <EmptyState>
      <h1>You are now ready to use the DVC VS Code extension</h1>
      <p>
        To learn more about how to use DVC please read{' '}
        <a href="https://dvc.org/doc">our docs</a>
      </p>
      <VSCodeButton onClick={openExperiments}>View Experiments</VSCodeButton>
    </EmptyState>
  )
}
