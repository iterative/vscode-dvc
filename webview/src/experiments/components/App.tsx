import { TableData } from 'dvc/src/experiments/webview/contract'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import React from 'react'
import Experiments from './Experiments'
import { dispatchActions } from '../../shared/dispatchActions'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import {
  update,
  updateChanges,
  updateCliError,
  updateColumnOrder,
  updateColumnWidths,
  updateColumns,
  updateFilters,
  updateHasBranchesToSelect,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateIsShowingMoreCommits,
  updateRows,
  updateSelectedBranches,
  updateSelectedForPlotsCount,
  updateShowOnlyChanged,
  updateSorts
} from '../state/tableDataSlice'
import { ExperimentsDispatch } from '../store'

const actionToDispatch = {
  changes: updateChanges,
  cliError: updateCliError,
  columnOrder: updateColumnOrder,
  columnWidths: updateColumnWidths,
  columns: updateColumns,
  filters: updateFilters,
  hasBranchesToSelect: updateHasBranchesToSelect,
  hasConfig: updateHasConfig,
  hasMoreCommits: updateHasMoreCommits,
  hasRunningWorkspaceExperiment: updateHasRunningWorkspaceExperiment,
  isShowingMoreCommits: updateIsShowingMoreCommits,
  rows: updateRows,
  selectedBranches: updateSelectedBranches,
  selectedForPlotsCount: updateSelectedForPlotsCount,
  showOnlyChanged: updateShowOnlyChanged,
  sorts: updateSorts
}

export type ExperimentsActions = typeof actionToDispatch

const feedStore = (
  data: MessageToWebview<TableData>,
  dispatch: ExperimentsDispatch
) => {
  if (data?.type !== MessageToWebviewType.SET_DATA) {
    return
  }
  const stateUpdate = data?.data
  dispatch(update(!!stateUpdate))

  dispatchActions(actionToDispatch, stateUpdate, dispatch)
}

export const App: React.FC<Record<string, unknown>> = () => {
  useVsCodeMessaging(feedStore)

  return <Experiments />
}
