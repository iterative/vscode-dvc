import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection,
  SetupData
} from 'dvc/src/setup/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import React, { useCallback, useState } from 'react'
import { Experiments } from './Experiments'
import { Studio } from './Studio'
import { SetupContainer } from './SetupContainer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'

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
  const [needsGitCommit, setNeedsGitCommit] = useState<boolean>(false)
  const [pythonBinPath, setPythonBinPath] = useState<string | undefined>(
    undefined
  )
  const [isPythonExtensionInstalled, setIsPythonExtensionInstalled] =
    useState<boolean>(false)
  const [hasData, setHasData] = useState<boolean | undefined>(false)
  const [sectionCollapsed, setSectionCollapsed] = useState(
    DEFAULT_SECTION_COLLAPSED
  )

  const [isStudioConnected, setIsStudioConnected] = useState<boolean>(false)
  const [shareLiveToStudio, setShareLiveToStudioValue] =
    useState<boolean>(false)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        setCanGitInitialized(data.data.canGitInitialize)
        setCliCompatible(data.data.cliCompatible)
        setHasData(data.data.hasData)
        setIsPythonExtensionInstalled(data.data.isPythonExtensionInstalled)
        setNeedsGitInitialized(data.data.needsGitInitialized)
        setNeedsGitCommit(data.data.needsGitCommit)
        setProjectInitialized(data.data.projectInitialized)
        setPythonBinPath(data.data.pythonBinPath)
        setIsStudioConnected(data.data.isStudioConnected)
        if (data.data.sectionCollapsed) {
          setSectionCollapsed(data.data.sectionCollapsed)
        }
        setShareLiveToStudioValue(data.data.shareLiveToStudio)
      },
      [
        setCanGitInitialized,
        setCliCompatible,
        setHasData,
        setIsPythonExtensionInstalled,
        setNeedsGitInitialized,
        setNeedsGitCommit,
        setProjectInitialized,
        setPythonBinPath,
        setIsStudioConnected,
        setSectionCollapsed,
        setShareLiveToStudioValue
      ]
    )
  )

  const setShareLiveToStudio = (shouldShareLive: boolean) => {
    setShareLiveToStudioValue(shouldShareLive)
    sendMessage({
      payload: shouldShareLive,
      type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
    })
  }

  return (
    <>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title={'Experiments'}
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
      >
        <Experiments
          canGitInitialize={canGitInitialize}
          cliCompatible={cliCompatible}
          hasData={hasData}
          isPythonExtensionInstalled={isPythonExtensionInstalled}
          needsGitInitialized={needsGitInitialized}
          needsGitCommit={needsGitCommit}
          projectInitialized={projectInitialized}
          pythonBinPath={pythonBinPath}
        />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.STUDIO}
        title={'Studio'}
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
      >
        <Studio
          isStudioConnected={isStudioConnected}
          shareLiveToStudio={shareLiveToStudio}
          setShareLiveToStudio={setShareLiveToStudio}
        />
      </SetupContainer>
    </>
  )
}
