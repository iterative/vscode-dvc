import cx from 'classnames'
import React, { useCallback, useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { isQueued, isRunning } from 'dvc/src/experiments/webview/contract'
import { FirstCell, CellWrapper } from './Cell'
import { RowContextMenu } from './RowContextMenu'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'
import { RowSelectionContext } from '../RowSelectionContext'
import { ContextMenu } from '../../../../shared/components/contextMenu/ContextMenu'
import { HandlerFunc } from '../../../../util/props'
import { ExperimentsState } from '../../../store'
import { toggleExperiment, toggleStarred } from '../../../util/messages'

export type BatchSelectionProp = {
  batchRowSelection: (prop: RowProp) => void
}

export const RowContent: React.FC<
  RowProp & { className?: string } & BatchSelectionProp
> = ({ row, className, batchRowSelection }): JSX.Element => {
  const changes = useSelector(
    (state: ExperimentsState) => state.tableData.changes
  )
  const { getVisibleCells, original, index, getIsExpanded, subRows } = row
  const { displayColor, error, starred, id, status, selected } = original
  const [firstCell, ...cells] = getVisibleCells()
  const isWorkspace = id === EXPERIMENT_WORKSPACE_ID
  const changesIfWorkspace = isWorkspace ? changes : undefined

  const { toggleRowSelected, selectedRows } = useContext(RowSelectionContext)

  const isRowSelected = !!selectedRows[id]

  const toggleRowSelection = useCallback<HandlerFunc<HTMLElement>>(
    args => {
      if (!isWorkspace) {
        if (args?.mouse?.shiftKey) {
          batchRowSelection({ row })
        } else {
          toggleRowSelected?.({ row })
        }
      }
    },
    [row, toggleRowSelected, isWorkspace, batchRowSelection]
  )

  const subRowStates = useMemo(() => {
    const stars = subRows?.filter(subRow => subRow.original.starred).length ?? 0
    const plotSelections =
      subRows?.filter(subRow => subRow.original.selected).length ?? 0

    const selections =
      subRows?.filter(subRow => selectedRows[subRow.original.id]).length ?? 0

    return {
      plotSelections,
      selections,
      stars
    }
  }, [subRows, selectedRows])

  const running = isRunning(status)
  const queued = isQueued(status)
  const unselected = selected === false
  const isOdd = index % 2 !== 0 && !isRowSelected

  return (
    <ContextMenu content={<RowContextMenu row={row} />}>
      <tr
        className={cx(
          className,
          styles.experimentsTr,
          styles.bodyRow,
          styles.row,
          {
            [styles.runningExperiment]: running,
            [styles.queuedExperiment]: queued,
            [styles.unselectedExperiment]: !running && !queued && unselected,
            [styles.normalExperiment]: !running && !queued && !unselected,
            [styles.oddRow]: isOdd,
            [styles.evenRow]: !isOdd,
            [styles.workspaceRow]: isWorkspace,
            [styles.normalRow]: !isWorkspace,
            [styles.rowSelected]: isRowSelected
          }
        )}
        tabIndex={0}
        aria-selected={isRowSelected}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell
          cell={firstCell}
          changesIfWorkspace={!!changesIfWorkspace?.length}
          bulletColor={displayColor}
          starred={starred}
          isRowSelected={isRowSelected}
          showSubRowStates={!getIsExpanded() && !isWorkspace}
          subRowStates={subRowStates}
          toggleExperiment={() => toggleExperiment(id)}
          toggleRowSelection={toggleRowSelection}
          toggleStarred={() => !isWorkspace && toggleStarred(id)}
        />
        {cells.map(cell => {
          const cellId = `${cell.column.id}___${cell.row.original.id}`
          return (
            <CellWrapper
              cell={cell}
              changes={changesIfWorkspace}
              error={error}
              key={cellId}
              cellId={cellId}
            />
          )
        })}
      </tr>
    </ContextMenu>
  )
}
