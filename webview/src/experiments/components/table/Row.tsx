import React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { RowProp } from './interfaces'
import styles from './styles.module.scss'
import { FirstCell, CellWrapper } from './Cell'
import { RowSelectionContext } from './RowSelectionContext'
import { RowContextMenu } from './RowContextMenu'
import { sendMessage } from '../../../shared/vscode'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import { HandlerFunc } from '../../../util/props'
import { cond } from '../../../util/helpers'
import { ExperimentsState } from '../../store'

const getExperimentTypeClass = ({ running, queued, selected }: Experiment) => {
  if (running) {
    return styles.runningExperiment
  }
  if (queued) {
    return styles.queuedExperiment
  }
  if (selected === false) {
    return styles.unselectedExperiment
  }

  return styles.normalExperiment
}

const getRowClassNames = (
  original: Experiment,
  flatIndex: number,
  isRowSelected: boolean,
  isWorkspace: boolean,
  className?: string,
  changes?: string[]
) => {
  return cx(
    className,
    styles.tr,
    styles.bodyRow,
    getExperimentTypeClass(original),
    cond(
      flatIndex % 2 !== 0 && !isRowSelected,
      () => styles.oddRow,
      () => styles.evenRow
    ),
    isWorkspace ? styles.workspaceRow : styles.normalRow,
    styles.row,
    isRowSelected && styles.rowSelected,
    isWorkspace && changes?.length && styles.workspaceWithChanges
  )
}

export type BatchSelectionProp = {
  batchRowSelection: (prop: RowProp) => void
}

export const RowContent: React.FC<
  RowProp & { className?: string } & BatchSelectionProp
> = ({
  row,
  className,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}): JSX.Element => {
  const changes = useSelector(
    (state: ExperimentsState) => state.tableData.changes
  )
  const {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    isExpanded,
    subRows,
    depth,
    values: { id }
  } = row
  const { displayColor, error, starred } = original
  const isWorkspace = id === 'workspace'
  const changesIfWorkspace = isWorkspace ? changes : undefined
  const toggleExperiment = () => {
    sendMessage({
      payload: id,
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
    })
  }

  const toggleStarred = () => {
    !isWorkspace &&
      sendMessage({
        payload: [id],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
  }

  const { toggleRowSelected, selectedRows } =
    React.useContext(RowSelectionContext)

  const isRowSelected = !!selectedRows[id]

  const toggleRowSelection = React.useCallback<HandlerFunc<HTMLElement>>(
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

  const subRowStates = React.useMemo(() => {
    const stars = subRows?.filter(subRow => subRow.original.starred).length ?? 0
    const plotSelections =
      subRows?.filter(subRow => subRow.original.selected).length ?? 0

    const selections =
      subRows?.filter(subRow => selectedRows[subRow.values.id]).length ?? 0

    return {
      plotSelections,
      selections,
      stars
    }
  }, [subRows, selectedRows])

  return (
    <ContextMenu
      disabled={contextMenuDisabled}
      content={
        <RowContextMenu
          row={row}
          projectHasCheckpoints={projectHasCheckpoints}
          hasRunningExperiment={hasRunningExperiment}
        />
      }
    >
      <div
        {...getRowProps({
          className: getRowClassNames(
            original,
            flatIndex,
            isRowSelected,
            isWorkspace,
            className,
            changes
          )
        })}
        tabIndex={0}
        role="row"
        aria-selected={isRowSelected}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell
          cell={firstCell}
          bulletColor={displayColor}
          starred={starred}
          isRowSelected={isRowSelected}
          showSubRowStates={!isExpanded && depth > 0}
          subRowStates={subRowStates}
          toggleExperiment={toggleExperiment}
          toggleRowSelection={toggleRowSelection}
          toggleStarred={toggleStarred}
        />
        {cells.map(cell => {
          const cellId = `${cell.column.id}___${cell.row.id}`
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
      </div>
    </ContextMenu>
  )
}
