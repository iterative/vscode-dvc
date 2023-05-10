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
import { SetupState } from '../store'
import {
  updateSectionCollapsed,
  updateHasData as updateWebviewHasData
} from '../state/webviewSlice'
import {
  updateCanGitInitalized,
  updateCliCompatible,
  updateDvcCliDetails,
  updateIsPythonExtensionUsed,
  updateNeedsGitInitialized,
  updateProjectInitialized,
  updatePythonBinPath
} from '../state/dvcSlice'
import {
  updateIsStudioConnected,
  updateShareLiveToStudio
} from '../state/studioSlice'
import {
  updateHasData as updateExperimentsHasData,
  updateNeedsGitCommit
} from '../state/experimentsSlice'

export const App: React.FC = () => {
  const sectionCollapsed = useSelector(
    (state: SetupState) => state.webview.sectionCollapsed
  )
  const { projectInitialized, cliCompatible } = useSelector(
    (state: SetupState) => state.dvc
  )
  const hasExperimentsData = useSelector(
    (state: SetupState) => state.experiments.hasData
  )
  const isStudioConnected = useSelector(
    (state: SetupState) => state.studio.isStudioConnected
  )

  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        if (!data?.data) {
          return
        }
        dispatch(updateWebviewHasData())
        for (const key of Object.keys(data.data)) {
          switch (key) {
            case 'canGitInitialize':
              dispatch(updateCanGitInitalized(data.data.canGitInitialize))
              continue
            case 'cliCompatible':
              dispatch(updateCliCompatible(data.data.cliCompatible))
              continue
            case 'dvcCliDetails':
              dispatch(updateDvcCliDetails(data.data.dvcCliDetails))
              continue
            case 'hasData':
              dispatch(updateExperimentsHasData(data.data.hasData))
              continue
            case 'isPythonExtensionUsed':
              dispatch(
                updateIsPythonExtensionUsed(data.data.isPythonExtensionUsed)
              )
              continue
            case 'isStudioConnected':
              dispatch(updateIsStudioConnected(data.data.isStudioConnected))
              continue
            case 'needsGitCommit':
              dispatch(updateNeedsGitCommit(data.data.needsGitCommit))
              continue
            case 'needsGitInitialized':
              dispatch(updateNeedsGitInitialized(data.data.needsGitInitialized))
              continue
            case 'projectInitialized':
              dispatch(updateProjectInitialized(data.data.projectInitialized))
              continue
            case 'pythonBinPath':
              dispatch(updatePythonBinPath(data.data.pythonBinPath))
              continue
            case 'sectionCollapsed':
              dispatch(updateSectionCollapsed(data.data.sectionCollapsed))
              continue
            case 'shareLiveToStudio':
              dispatch(updateShareLiveToStudio(data.data.shareLiveToStudio))
              continue
            default:
              continue
          }
        }
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
        <Dvc />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title="Experiments"
        sectionCollapsed={sectionCollapsed || DEFAULT_SECTION_COLLAPSED}
        isSetup={isDvcSetup && !!hasExperimentsData}
      >
        <Experiments isDvcSetup={projectInitialized && !!cliCompatible} />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.STUDIO}
        title="Studio"
        sectionCollapsed={sectionCollapsed || DEFAULT_SECTION_COLLAPSED}
        isSetup={!!cliCompatible}
        isConnected={isStudioConnected}
      >
        <Studio
          setShareLiveToStudio={setShareLiveToStudio}
          cliCompatible={!!cliCompatible}
        />
      </SetupContainer>
    </>
  )
}
