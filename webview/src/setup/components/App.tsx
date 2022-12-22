import { SetupData } from 'dvc/src/setup/webview/contract'
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
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const App: React.FC = () => {
  const [cliAvailable, setCliAvailable] = useState<boolean>(false)
  const [projectInitialized, setProjectInitialized] = useState<boolean>(false)
  const [pythonBinPath, setPythonBinPath] = useState<string | undefined>(
    undefined
  )
  const [isPythonExtensionInstalled, setIsPythonExtensionInstalled] =
    useState<boolean>(false)
  const [hasData, setHasData] = useState<boolean | undefined>(false)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        setCliAvailable(data.data.cliAccessible)
        setIsPythonExtensionInstalled(data.data.isPythonExtensionInstalled)
        setProjectInitialized(data.data.projectInitialized)
        setPythonBinPath(data.data.pythonBinPath)
        setHasData(data.data.hasData)
      },
      [
        setCliAvailable,
        setIsPythonExtensionInstalled,
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

  const installDvc = () => {
    sendMessage({ type: MessageFromWebviewType.INSTALL_DVC })
  }

  const selectPythonInterpreter = () => {
    sendMessage({ type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER })
  }

  const setupWorkspace = () => {
    sendMessage({ type: MessageFromWebviewType.SETUP_WORKSPACE })
  }

  if (!cliAvailable) {
    return (
      <CliUnavailable
        installDvc={installDvc}
        isPythonExtensionInstalled={isPythonExtensionInstalled}
        pythonBinPath={pythonBinPath}
        selectPythonInterpreter={selectPythonInterpreter}
        setupWorkspace={setupWorkspace}
      />
    )
  }

  if (!projectInitialized) {
    return <ProjectUninitialized initializeProject={initializeProject} />
  }

  if (hasData === undefined) {
    return <EmptyState>Loading Project...</EmptyState>
  }

  if (!hasData) {
    return <NoData />
  }

  return null
}
