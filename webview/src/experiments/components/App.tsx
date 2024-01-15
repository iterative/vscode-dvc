import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { TableData } from 'dvc/src/experiments/webview/contract'
import Experiments from './Experiments'
import {
  update,
  updateSelectedBranches,
  updateChanges,
  updateCliError,
  updateColumnOrder,
  updateColumns,
  updateColumnWidths,
  updateFilters,
  updateHasBranchesToSelect,
  updateHasCheckpoints,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateIsShowingMoreCommits,
  updateRows,
  updateSelectedForPlotsCount,
  updateSorts,
  updateShowOnlyChanged
} from '../state/tableDataSlice'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { ExperimentsDispatch } from '../store'

const actionToDispatch = {
  changes: updateChanges,
  cliError: updateCliError,
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
} as const

const feedStore = (
  data: MessageToWebview<TableData>,
  dispatch: ExperimentsDispatch
) => {
  if (data?.type !== MessageToWebviewType.SET_DATA) {
    return
  }
  dispatch(update(!!data.data))

  for (const key of Object.keys(data.data)) {
    const tKey = key as keyof typeof data.data
    const action = actionToDispatch[tKey]
    const value = data.data[tKey]
    if (!action) {
      continue
    }
    dispatch(action(value as never))
  }
}

export const App: React.FC<Record<string, unknown>> = () => {
  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<TableData> }) => {
        feedStore(data, dispatch)
      },
      [dispatch]
    )
  )

  return <Experiments />
}
