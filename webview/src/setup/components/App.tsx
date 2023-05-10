import {
  SetupSection,
  SetupData,
  DEFAULT_SECTION_COLLAPSED
} from 'dvc/src/setup/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dvc } from './dvc/Dvc'
import { Experiments } from './experiments/Experiments'
import { Studio } from './studio/Studio'
import { SetupContainer } from './SetupContainer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'
import { update, updateShareLiveToStudio } from '../state/setupDataSlice'
import { SetupState } from '../store'

export const App: React.FC = () => {
  const {
    canGitInitialize,
    cliCompatible,
    dvcCliDetails,
    hasData,
    hasReceivedMessageFromVsCode,
    isPythonExtensionUsed,
    isStudioConnected,
    needsGitCommit,
    needsGitInitialized,
    projectInitialized,
    pythonBinPath,
    sectionCollapsed,
    shareLiveToStudio
  } = useSelector((state: SetupState) => state.setupData)

  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        if (!data?.data) {
          return
        }
        dispatch(update(data.data))
      },
      [dispatch]
    )
  )

  const setShareLiveToStudio = (shouldShareLive: boolean) => {
    dispatch(updateShareLiveToStudio(shouldShareLive))
    sendMessage({
      payload: shouldShareLive,
      type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
    })
  }

  const isDvcSetup = !!cliCompatible && projectInitialized

  return (
    <>
      <SetupContainer
        sectionKey={SetupSection.DVC}
        title="DVC"
        sectionCollapsed={sectionCollapsed || DEFAULT_SECTION_COLLAPSED}
        isSetup={isDvcSetup}
      >
        <Dvc
          canGitInitialize={canGitInitialize}
          cliCompatible={cliCompatible}
          dvcCliDetails={dvcCliDetails}
          isPythonExtensionUsed={isPythonExtensionUsed}
          needsGitInitialized={needsGitInitialized}
          projectInitialized={projectInitialized}
          pythonBinPath={pythonBinPath}
          hasReceivedMessageFromVsCode={hasReceivedMessageFromVsCode}
        />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title="Experiments"
        sectionCollapsed={sectionCollapsed || DEFAULT_SECTION_COLLAPSED}
        isSetup={isDvcSetup && !!hasData}
      >
        <Experiments
          needsGitCommit={needsGitCommit}
          isDvcSetup={projectInitialized && !!cliCompatible}
          hasData={hasData}
        />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.STUDIO}
        title="Studio"
        sectionCollapsed={sectionCollapsed || DEFAULT_SECTION_COLLAPSED}
        isSetup={!!cliCompatible}
        isConnected={isStudioConnected}
      >
        <Studio
          isStudioConnected={isStudioConnected}
          shareLiveToStudio={shareLiveToStudio}
          setShareLiveToStudio={setShareLiveToStudio}
          cliCompatible={!!cliCompatible}
        />
      </SetupContainer>
    </>
  )
}
