import cx from 'classnames'
import React, { memo, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { StubCell, CellWrapper } from './Cell'
import { RowContextMenu } from './RowContextMenu'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'
import { ContextMenu } from '../../../../shared/components/contextMenu/ContextMenu'
import { HandlerFunc } from '../../../../util/props'
import { ExperimentsState } from '../../../store'
import { toggleExperiment, toggleStarred } from '../../../util/messages'
import { getCompositeId } from '../../../util/rows'
import {
  selectRowRange,
  toggleRowSelected
} from '../../../state/rowSelectionSlice'

const Row: React.FC<RowProp & { className?: string; isExpanded: boolean }> = ({
  row,
  isExpanded,
  className
}): JSX.Element => {
  const changes = useSelector(
    (state: ExperimentsState) => state.tableData.changes
  )
  const dispatch = useDispatch()
  const { selectedRows } = useSelector(
    (state: ExperimentsState) => state.rowSelection
  )
  const { getVisibleCells, original, subRows } = row
  const { branch, displayColor, error, starred, id } = original
  const [stubCell, ...cells] = getVisibleCells()
  const isWorkspace = id === EXPERIMENT_WORKSPACE_ID

  const changesIfWorkspace = isWorkspace ? changes : undefined

  const isRowSelected = !!selectedRows[getCompositeId(id, branch)]

  const toggleRowSelection = useCallback<HandlerFunc<HTMLElement>>(
    args => {
      if (!isWorkspace) {
        const { original, depth } = row
        const { starred, executorStatus, id, branch } = original

        const selectedRow = { branch, depth, executorStatus, id, starred }

        if (args?.mouse?.shiftKey) {
          dispatch(selectRowRange(selectedRow))
        } else {
          dispatch(toggleRowSelected(selectedRow))
        }
      }
    },
    [dispatch, row, isWorkspace]
  )

  const subRowStates = useMemo(() => {
    const stars = subRows?.filter(subRow => subRow.original.starred).length ?? 0
    const plotSelections =
      subRows?.filter(subRow => subRow.original.selected).length ?? 0

    const selections =
      subRows?.filter(
        subRow =>
          selectedRows[
            getCompositeId(subRow.original.id, subRow.original.branch)
          ]
      ).length ?? 0

    return {
      plotSelections,
      selections,
      stars
    }
  }, [subRows, selectedRows])

  return (
    <ContextMenu content={<RowContextMenu row={row} />}>
      <tr
        className={cx(
          className,
          styles.experimentsTr,
          styles.bodyRow,
          styles.row,
          {
            [styles.rowSelected]: isRowSelected
          }
        )}
        tabIndex={0}
        aria-selected={isRowSelected}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <StubCell
          cell={stubCell}
          changesIfWorkspace={!!changesIfWorkspace?.length}
          plotColor={displayColor}
          starred={starred}
          isRowSelected={isRowSelected}
          showSubRowStates={!isExpanded && !isWorkspace}
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

export const TableRow = memo(Row)
