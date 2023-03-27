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
  updateFilteredCounts,
  updateFilters,
  updateHasCheckpoints,
  updateHasColumns,
  updateHasConfig,
  updateHasMoreCommits,
  updateHasRunningExperiment,
  updateHasValidDvcYaml,
  updateIsShowingMoreCommits,
  updateRows,
  updateSorts
} from './table/tableDataSlice'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC<Record<string, unknown>> = () => {
  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      // eslint-disable-next-line sonarjs/cognitive-complexity
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
              case 'filteredCounts':
                dispatch(updateFilteredCounts(data.data.filteredCounts))
                continue
              case 'filters':
                dispatch(updateFilters(data.data.filters))
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
                  updateHasRunningExperiment(data.data.hasRunningExperiment)
                )
                continue
              case 'hasValidDvcYaml':
                dispatch(updateHasValidDvcYaml(data.data.hasValidDvcYaml))
                continue
              case 'isShowingMoreCommits':
                dispatch(
                  updateIsShowingMoreCommits(data.data.isShowingMoreCommits)
                )
              case 'rows':
                dispatch(updateRows(data.data.rows))
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
