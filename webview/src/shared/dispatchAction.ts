import { UnknownAction } from '@reduxjs/toolkit'
import { TableData } from 'dvc/src/experiments/webview/contract'
import { PlotsData, PlotsDataKeys } from 'dvc/src/plots/webview/contract'
import { SetupData } from 'dvc/src/setup/webview/contract'
import {
  updateChanges,
  updateColumnOrder,
  updateColumnWidths,
  updateColumns,
  updateFilters,
  updateHasBranchesToSelect,
  updateHasCheckpoints,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateIsShowingMoreCommits,
  updateRows,
  updateSelectedBranches,
  updateSelectedForPlotsCount,
  updateShowOnlyChanged,
  updateSorts,
  updateCliError as updateTableCliError
} from '../experiments/state/tableDataSlice'
import { ExperimentsDispatch } from '../experiments/store'
import {
  update as updateComparisonTable,
  updateShouldShowTooManyPlotsMessage as updateShouldShowTooManyImagesMessage
} from '../plots/components/comparisonTable/comparisonTableSlice'
import { update as updateCustomPlots } from '../plots/components/customPlots/customPlotsSlice'
import {
  updateShouldShowTooManyPlotsMessage as updateShouldShowTooManyTemplatesMessage,
  update as updateTemplatePlots
} from '../plots/components/templatePlots/templatePlotsSlice'
import {
  updateHasPlots,
  updateHasUnselectedPlots,
  updatePlotErrors,
  updateCliError as updatePlotsCliError,
  updateSelectedRevisions
} from '../plots/components/webviewSlice'
import { PlotsDispatch } from '../plots/store'
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
} from '../setup/state/dvcSlice'
import {
  updateHasData as updateExperimentsHasData,
  updateNeedsGitCommit
} from '../setup/state/experimentsSlice'
import { updateRemoteList } from '../setup/state/remoteSlice'
import {
  updateIsStudioConnected,
  updateSelfHostedStudioUrl,
  updateShareLiveToStudio
} from '../setup/state/studioSlice'
import { updateSectionCollapsed } from '../setup/state/webviewSlice'
import { SetupDispatch } from '../setup/store'

const actionToDispatch = {
  experiments: {
    changes: updateChanges,
    cliError: updateTableCliError,
    columnOrder: updateColumnOrder,
    columnWidths: updateColumnWidths,
    columns: updateColumns,
    filters: updateFilters,
    hasBranchesToSelect: updateHasBranchesToSelect,
    hasCheckpoints: updateHasCheckpoints,
    hasConfig: updateHasConfig,
    hasMoreCommits: updateHasMoreCommits,
    hasRunningWorkspaceExperiment: updateHasRunningWorkspaceExperiment,
    isShowingMoreCommits: updateIsShowingMoreCommits,
    rows: updateRows,
    selectedBranches: updateSelectedBranches,
    selectedForPlotsCount: updateSelectedForPlotsCount,
    showOnlyChanged: updateShowOnlyChanged,
    sorts: updateSorts
  },
  plots: {
    [PlotsDataKeys.CLI_ERROR]: updatePlotsCliError,
    [PlotsDataKeys.CUSTOM]: updateCustomPlots,
    [PlotsDataKeys.COMPARISON]: updateComparisonTable,
    [PlotsDataKeys.TEMPLATE]: updateTemplatePlots,
    [PlotsDataKeys.HAS_PLOTS]: updateHasPlots,
    [PlotsDataKeys.HAS_UNSELECTED_PLOTS]: updateHasUnselectedPlots,
    [PlotsDataKeys.PLOT_ERRORS]: updatePlotErrors,
    [PlotsDataKeys.SELECTED_REVISIONS]: updateSelectedRevisions,
    [PlotsDataKeys.SHOW_TOO_MANY_TEMPLATE_PLOTS]:
      updateShouldShowTooManyTemplatesMessage,
    [PlotsDataKeys.SHOW_TOO_MANY_COMPARISON_IMAGES]:
      updateShouldShowTooManyImagesMessage
  },
  setup: {
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
  }
} as const

export const dispatchAction = (
  type: keyof typeof actionToDispatch,
  stateUpdate: NonNullable<TableData | PlotsData | SetupData>,
  dispatch: ExperimentsDispatch | PlotsDispatch | SetupDispatch
) => {
  const actions = actionToDispatch[type]

  for (const key of Object.keys(stateUpdate)) {
    const tKey = key as keyof typeof stateUpdate
    const value = stateUpdate[tKey]
    const action = actions[tKey] as (input: typeof value) => UnknownAction

    if (!action) {
      continue
    }
    dispatch(action(value))
  }
}
