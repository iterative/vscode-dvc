import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection,
  SetupData,
  DvcCliDetails
} from 'dvc/src/setup/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import React, { useCallback, useState } from 'react'
import { Dvc } from './dvc/Dvc'
import { Experiments } from './Experiments'
import { Studio } from './studio/Studio'
import { SetupContainer } from './SetupContainer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'

export const App: React.FC = () => {
  const [cliCompatible, setCliCompatible] = useState<boolean | undefined>(
    undefined
  )
  const [dvcCliDetails, setDvcCliDetails] = useState<DvcCliDetails | undefined>(
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
  const [isPythonExtensionUsed, setisPythonExtensionUsed] =
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
        if (!data?.data) {
          return
        }
        setCanGitInitialized(data.data.canGitInitialize)
        setCliCompatible(data.data.cliCompatible)
        setHasData(data.data.hasData)
        setDvcCliDetails(data.data.dvcCliDetails)
        setisPythonExtensionUsed(data.data.isPythonExtensionUsed)
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
        setDvcCliDetails,
        setisPythonExtensionUsed,
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

  const isDvcSetup = cliCompatible && projectInitialized

  return (
    <>
      <SetupContainer
        sectionKey={SetupSection.DVC}
        title="DVC"
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
        isComplete={isDvcSetup}
        hasError={false}
      >
        <Dvc
          canGitInitialize={canGitInitialize}
          cliCompatible={cliCompatible}
          dvcCliDetails={dvcCliDetails}
          isPythonExtensionUsed={isPythonExtensionUsed}
          needsGitInitialized={needsGitInitialized}
          projectInitialized={projectInitialized}
          pythonBinPath={pythonBinPath}
          isExperimentsAvailable={hasData}
          setSectionCollapsed={setSectionCollapsed}
        />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title="Experiments"
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
        isComplete={!!hasData}
        hasError={!isDvcSetup}
      >
        <Experiments
          needsGitCommit={needsGitCommit}
          isDvcSetup={projectInitialized && !!cliCompatible}
          hasData={hasData}
          setSectionCollapsed={setSectionCollapsed}
        />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.STUDIO}
        title="Studio"
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
        hasError={!cliCompatible}
      >
        <Studio
          isStudioConnected={isStudioConnected}
          shareLiveToStudio={shareLiveToStudio}
          setSectionCollapsed={setSectionCollapsed}
          setShareLiveToStudio={setShareLiveToStudio}
          cliCompatible={!!cliCompatible}
        />
      </SetupContainer>
    </>
  )
}
