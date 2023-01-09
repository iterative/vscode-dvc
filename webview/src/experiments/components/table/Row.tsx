/* eslint-disable @typescript-eslint/no-unsafe-return */
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import {
  Experiment,
  isQueued,
  isRunning
} from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
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

const getExperimentTypeClass = ({ status, selected }: Experiment) => {
  if (isRunning(status)) {
    return styles.runningExperiment
  }
  if (isQueued(status)) {
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
  isRowFocused: boolean,
  isRowSelected: boolean,
  isWorkspace: boolean,
  className?: string
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
    isRowFocused && styles.rowFocused
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
  const isWorkspace = id === EXPERIMENT_WORKSPACE_ID
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

  const [menuActive, setMenuActive] = useState<boolean>(false)

  return (
    <ContextMenu
      disabled={contextMenuDisabled}
      onShow={() => {
        setMenuActive(true)
      }}
      onHide={() => {
        setMenuActive(false)
      }}
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
            menuActive,
            isRowSelected,
            isWorkspace,
            className
          )
        })}
        tabIndex={0}
        role="row"
        aria-selected={isRowSelected}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell
          cell={firstCell}
          changesIfWorkspace={!!changesIfWorkspace?.length}
          bulletColor={displayColor}
          starred={starred}
          isRowSelected={isRowSelected}
          isWorkspace={isWorkspace}
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
