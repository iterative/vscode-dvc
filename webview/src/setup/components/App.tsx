import { SetupData, SetupSection } from 'dvc/src/setup/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SetupContainer } from './SetupContainer'
import { Dvc } from './dvc/Dvc'
import { Experiments } from './experiments/Experiments'
import { Remotes } from './remotes/Remotes'
import { Studio } from './studio/Studio'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'
import { dispatchActions } from '../../shared/dispatchActions'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import {
  updateCanGitInitialize,
  updateCliCompatible,
  updateDvcCliDetails,
  updateIsAboveLatestTestedVersion,
  updateIsPythonEnvironmentGlobal,
  updateIsPythonExtensionInstalled,
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
  updateSelfHostedStudioUrl,
  updateShareLiveToStudio
} from '../state/studioSlice'
import { initialize, updateSectionCollapsed } from '../state/webviewSlice'
import { SetupDispatch, SetupState } from '../store'
import { setStudioShareExperimentsLive } from '../util/messages'

const getDvcStatusIcon = (
  isDvcSetup: boolean,
  isVersionAboveLatestTested: boolean
) => {
  if (!isDvcSetup) {
    return TooltipIconType.ERROR
  }

  return isVersionAboveLatestTested
    ? TooltipIconType.WARNING
    : TooltipIconType.PASSED
}

const getStudioStatusIcon = (cliCompatible: boolean, isConnected: boolean) => {
  if (!cliCompatible) {
    return TooltipIconType.ERROR
  }

  return isConnected ? TooltipIconType.PASSED : TooltipIconType.WARNING
}

const actionToDispatch = {
  canGitInitialize: updateCanGitInitialize,
  cliCompatible: updateCliCompatible,
  dvcCliDetails: updateDvcCliDetails,
  hasData: updateExperimentsHasData,
  isAboveLatestTestedVersion: updateIsAboveLatestTestedVersion,
  isPythonEnvironmentGlobal: updateIsPythonEnvironmentGlobal,
  isPythonExtensionInstalled: updateIsPythonExtensionInstalled,
  isPythonExtensionUsed: updateIsPythonExtensionUsed,
  isStudioConnected: updateIsStudioConnected,
  needsGitCommit: updateNeedsGitCommit,
  needsGitInitialized: updateNeedsGitInitialized,
  projectInitialized: updateProjectInitialized,
  pythonBinPath: updatePythonBinPath,
  remoteList: updateRemoteList,
  sectionCollapsed: updateSectionCollapsed,
  selfHostedStudioUrl: updateSelfHostedStudioUrl,
  shareLiveToStudio: updateShareLiveToStudio
} as const

export type SetupActions = typeof actionToDispatch

export const feedStore = (
  data: MessageToWebview<SetupData>,
  dispatch: SetupDispatch
) => {
  const stateUpdate = data?.data
  if (!stateUpdate) {
    return
  }
  dispatch(initialize())

  dispatchActions(actionToDispatch, stateUpdate, dispatch)
}

export const App: React.FC = () => {
  const { projectInitialized, cliCompatible, isAboveLatestTestedVersion } =
    useSelector((state: SetupState) => state.dvc)
  const hasExperimentsData = useSelector(
    (state: SetupState) => state.experiments.hasData
  )
  const { remoteList } = useSelector((state: SetupState) => state.remote)

  const isStudioConnected = useSelector(
    (state: SetupState) => state.studio.isStudioConnected
  )

  const dispatch = useDispatch()

  useVsCodeMessaging(feedStore)

  const setShareLiveToStudio = (shouldShareLive: boolean) => {
    dispatch(updateShareLiveToStudio(shouldShareLive))
    setStudioShareExperimentsLive(shouldShareLive)
  }

  const isDvcSetup = !!cliCompatible && projectInitialized

  return (
    <>
      <SetupContainer
        sectionKey={SetupSection.DVC}
        title="DVC"
        icon={getDvcStatusIcon(isDvcSetup, !!isAboveLatestTestedVersion)}
        overrideSectionDescription={
          isAboveLatestTestedVersion ? (
            <>
              The located version has not been tested against the extension. If
              you are experiencing unexpected behaviour, first try to update the
              extension. If there are no updates available, please downgrade DVC
              to the same minor version as displayed and reload the window.
            </>
          ) : undefined
        }
      >
        <Dvc />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.EXPERIMENTS}
        title="Experiments"
        icon={
          isDvcSetup && hasExperimentsData
            ? TooltipIconType.PASSED
            : TooltipIconType.ERROR
        }
      >
        <Experiments isDvcSetup={projectInitialized && !!cliCompatible} />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.REMOTES}
        title="Remotes"
        icon={
          remoteList && Object.values(remoteList).some(Boolean)
            ? TooltipIconType.PASSED
            : TooltipIconType.ERROR
        }
      >
        <Remotes cliCompatible={!!cliCompatible} remoteList={remoteList} />
      </SetupContainer>
      <SetupContainer
        sectionKey={SetupSection.STUDIO}
        title="DVC Studio"
        icon={getStudioStatusIcon(!!cliCompatible, isStudioConnected)}
      >
        <Studio
          setShareLiveToStudio={setShareLiveToStudio}
          cliCompatible={!!cliCompatible}
        />
      </SetupContainer>
    </>
  )
}
