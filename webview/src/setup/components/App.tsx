import { SetupData } from 'dvc/src/setup/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import React, { useCallback, useState } from 'react'
import { CliIncompatible } from './CliIncompatible'
import { CliUnavailable } from './CliUnavailable'
import { ProjectUninitialized } from './ProjectUninitialized'
import { NoData } from './NoData'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

// eslint-disable-next-line sonarjs/cognitive-complexity
export const App: React.FC = () => {
  const [cliCompatible, setCliCompatible] = useState<boolean | undefined>(
    undefined
  )
  const [projectInitialized, setProjectInitialized] = useState<boolean>(false)
  const [needsGitInitialized, setNeedsGitInitialized] = useState<
    boolean | undefined
  >(false)
  const [canGitInitialize, setCanGitInitialized] = useState<
    boolean | undefined
  >(false)
  const [pythonBinPath, setPythonBinPath] = useState<string | undefined>(
    undefined
  )
  const [isPythonExtensionInstalled, setIsPythonExtensionInstalled] =
    useState<boolean>(false)
  const [hasData, setHasData] = useState<boolean | undefined>(false)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        setCanGitInitialized(data.data.canGitInitialize)
        setCliCompatible(data.data.cliCompatible)
        setHasData(data.data.hasData)
        setIsPythonExtensionInstalled(data.data.isPythonExtensionInstalled)
        setNeedsGitInitialized(data.data.needsGitInitialized)
        setProjectInitialized(data.data.projectInitialized)
        setPythonBinPath(data.data.pythonBinPath)
      },
      [
        setCanGitInitialized,
        setCliCompatible,
        setHasData,
        setIsPythonExtensionInstalled,
        setNeedsGitInitialized,
        setProjectInitialized,
        setPythonBinPath
      ]
    )
  )

  const checkCompatibility = () => {
    sendMessage({ type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE })
  }

  const initializeGit = () => {
    sendMessage({
      type: MessageFromWebviewType.INITIALIZE_GIT
    })
  }

  const initializeDvc = () => {
    sendMessage({
      type: MessageFromWebviewType.INITIALIZE_DVC
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

  if (cliCompatible === false) {
    return <CliIncompatible checkCompatibility={checkCompatibility} />
  }

  if (cliCompatible === undefined) {
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
    return (
      <ProjectUninitialized
        canGitInitialize={canGitInitialize}
        initializeDvc={initializeDvc}
        initializeGit={initializeGit}
        needsGitInitialized={needsGitInitialized}
      />
    )
  }

  if (hasData === undefined) {
    return <EmptyState>Loading Project...</EmptyState>
  }

  if (!hasData) {
    return <NoData />
  }

  return null
}
