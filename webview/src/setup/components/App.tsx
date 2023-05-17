import { SetupSection, SetupData } from 'dvc/src/setup/webview/contract'
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
import { Remotes } from './remote/Remotes'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'
import { SetupDispatch, SetupState } from '../store'
import {
  updateSectionCollapsed,
  updateHasData as updateWebviewHasData
} from '../state/webviewSlice'
import {
  updateCanGitInitialize,
  updateCliCompatible,
  updateDvcCliDetails,
  updateIsPythonExtensionUsed,
  updateNeedsGitInitialized,
  updateProjectInitialized,
  updatePythonBinPath
} from '../state/dvcSlice'
import {
  updateHasData as updateExperimentsHasData,
  updateNeedsGitCommit
} from '../state/experimentsSlice'
import { updateRemoteList } from '../state/remoteSlice'
import {
  updateIsStudioConnected,
  updateShareLiveToStudio
} from '../state/studioSlice'

export const feedStore = (
  data: MessageToWebview<SetupData>,
  dispatch: SetupDispatch
) => {
  if (!data?.data) {
    return
  }
  dispatch(updateWebviewHasData())
  for (const key of Object.keys(data.data)) {
    switch (key) {
      case 'canGitInitialize':
        dispatch(updateCanGitInitialize(data.data.canGitInitialize))
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
        dispatch(updateIsPythonExtensionUsed(data.data.isPythonExtensionUsed))
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
      case 'remoteList':
        dispatch(updateRemoteList(data.data.remoteList))
        continue

      default:
        continue
    }
  }
}

export const App: React.FC = () => {
  const { projectInitialized, cliCompatible } = useSelector(
    (state: SetupState) => state.dvc
  )
  const hasExperimentsData = useSelector(
    (state: SetupState) => state.experiments.hasData
  )
  const { remoteList } = useSelector((state: SetupState) => state.remote)

  const isStudioConnected = useSelector(
    (state: SetupState) => state.studio.isStudioConnected
  )

  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        feedStore(data, dispatch)
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
        isSetup={isDvcSetup}
      >
        <Dvc />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title="Experiments"
        isSetup={isDvcSetup && !!hasExperimentsData}
      >
        <Experiments isDvcSetup={projectInitialized && !!cliCompatible} />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.REMOTES}
        title="Remotes"
        isSetup={!!(remoteList && Object.values(remoteList).some(Boolean))}
      >
        <Remotes cliCompatible={!!cliCompatible} remoteList={remoteList} />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.STUDIO}
        title="Studio"
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
