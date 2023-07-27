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
  updateHasColumns,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateIsShowingMoreCommits,
  updateRows,
  updateSelectedForPlotsCount,
  updateSorts
} from '../state/tableDataSlice'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC<Record<string, unknown>> = () => {
  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<TableData> }) => {
        if (data.type === MessageToWebviewType.SET_DATA) {
          dispatch(update(!!data.data))
          for (const key of Object.keys(data.data)) {
            switch (key) {
              case 'changes':
                dispatch(updateChanges(data.data.changes))
                continue
              case 'cliError':
                dispatch(updateCliError(data.data.cliError))
                continue
              case 'columnOrder':
                dispatch(updateColumnOrder(data.data.columnOrder))
                continue
              case 'columns':
                dispatch(updateColumns(data.data.columns))
                continue
              case 'columnsWidths':
                dispatch(updateColumnWidths(data.data.columnWidths))
                continue
              case 'filters':
                dispatch(updateFilters(data.data.filters))
                continue
              case 'hasBranchesToSelect':
                dispatch(
                  updateHasBranchesToSelect(data.data.hasBranchesToSelect)
                )
                continue
              case 'hasCheckpoints':
                dispatch(updateHasCheckpoints(data.data.hasCheckpoints))
                continue
              case 'hasColumns':
                dispatch(updateHasColumns(data.data.hasColumns))
                continue
              case 'hasConfig':
                dispatch(updateHasConfig(data.data.hasConfig))
                continue
              case 'hasMoreCommits':
                dispatch(updateHasMoreCommits(data.data.hasMoreCommits))
                continue
              case 'hasRunningWorkspaceExperiment':
                dispatch(
                  updateHasRunningWorkspaceExperiment(
                    data.data.hasRunningWorkspaceExperiment
                  )
                )
                continue
              case 'isShowingMoreCommits':
                dispatch(
                  updateIsShowingMoreCommits(data.data.isShowingMoreCommits)
                )
                continue
              case 'rows':
                dispatch(updateRows(data.data.rows))
                continue
              case 'selectedBranches':
                dispatch(updateSelectedBranches(data.data.selectedBranches))
                continue
              case 'selectedForPlotsCount':
                dispatch(
                  updateSelectedForPlotsCount(data.data.selectedForPlotsCount)
                )
                continue
              case 'sorts':
                dispatch(updateSorts(data.data.sorts))
                continue
              default:
                continue
            }
          }
        }
      },
      [dispatch]
    )
  )

  return <Experiments />
}
