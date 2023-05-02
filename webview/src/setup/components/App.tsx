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
  const [hasReceivedMessageFromVsCode, setHasReceivedMessageFromVsCode] =
    useState(false)

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
        // TBD There is probably a better way to go about this...
        setHasReceivedMessageFromVsCode(true)
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

  const closeSection = (section: SetupSection) => {
    setSectionCollapsed({ ...sectionCollapsed, [section]: true })
  }

  return (
    <>
      <SetupContainer
        sectionKey={SetupSection.DVC}
        title="DVC"
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
      >
        <Dvc
          canGitInitialize={canGitInitialize}
          cliCompatible={cliCompatible}
          dvcCliDetails={dvcCliDetails}
          isPythonExtensionUsed={isPythonExtensionUsed}
          needsGitInitialized={needsGitInitialized}
          projectInitialized={projectInitialized}
          pythonBinPath={pythonBinPath}
          closeSection={closeSection}
          hasReceivedMessageFromVsCode={hasReceivedMessageFromVsCode}
        />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title="Experiments"
        sectionCollapsed={sectionCollapsed}
        setSectionCollapsed={setSectionCollapsed}
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
