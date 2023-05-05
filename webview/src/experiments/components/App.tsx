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
  updateChanges,
  updateColumnOrder,
  updateColumns,
  updateColumnWidths,
  updateFilteredCount,
  updateFilters,
  updateHasBranchesToSelect,
  updateHasCheckpoints,
  updateHasColumns,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningWorkspaceExperiment,
  updateHasValidDvcYaml,
  updateIsBranchesView,
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
              case 'columnOrder':
                dispatch(updateColumnOrder(data.data.columnOrder))
                continue
              case 'columns':
                dispatch(updateColumns(data.data.columns))
                continue
              case 'columnsWidths':
                dispatch(updateColumnWidths(data.data.columnWidths))
                continue
              case 'filteredCount':
                dispatch(updateFilteredCount(data.data.filteredCount))
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
              case 'hasRunningExperiment':
                dispatch(
                  updateHasRunningWorkspaceExperiment(
                    data.data.hasRunningWorkspaceExperiment
                  )
                )
                continue
              case 'hasValidDvcYaml':
                dispatch(updateHasValidDvcYaml(data.data.hasValidDvcYaml))
                continue
              case 'isBranchesView':
                dispatch(updateIsBranchesView(data.data.isBranchesView))
                continue
              case 'isShowingMoreCommits':
                dispatch(
                  updateIsShowingMoreCommits(data.data.isShowingMoreCommits)
                )
                continue
              case 'rows':
                dispatch(
                  updateRows(
                    // Setting any branch for now just so that it isn't undefined. It does not matter the label for now as it is not shown
                    data.data.rows.map(row => ({
                      ...row,
                      branch: 'current',
                      subRows: row.subRows?.map(subRow => ({
                        ...subRow,
                        branch: 'current'
                      }))
                    }))
                  )
                )
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
