import React, { EventHandler, SyntheticEvent } from 'react'
import { Cell } from 'react-table'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { RowProp, WithChanges } from './Row'
import ClockIcon from '../../../shared/components/icons/Clock'
import { sendMessage } from '../../../shared/vscode'
import styles from '../table/styles.module.scss'

const RowExpansionButton: React.FC<RowProp> = ({ row }) =>
  row.canExpand ? (
    <button
      title={`${row.isExpanded ? 'Contract' : 'Expand'} Row`}
      className={styles.rowArrowContainer}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        row.toggleRowExpanded()
      }}
      onKeyDown={e => {
        e.stopPropagation()
      }}
    >
      <span
        className={
          row.isExpanded ? styles.expandedRowArrow : styles.contractedRowArrow
        }
      />
    </button>
  ) : (
    <span className={styles.rowArrowContainer} />
  )

const FirstCell: React.FC<{
  cell: Cell<Experiment, unknown>
  bulletColor?: string
}> = ({ cell, bulletColor }) => {
  const { row, isPlaceholder } = cell

  return (
    <div
      {...cell.getCellProps({
        className: cx(
          styles.firstCell,
          styles.td,
          styles.experimentCell,
          isPlaceholder && styles.groupPlaceholder
        )
      })}
    >
      <div className={styles.innerCell}>
        <RowExpansionButton row={row} />
        <span className={styles.bullet} style={{ color: bulletColor }}>
          {row.original.queued && <ClockIcon />}
        </span>
        {isPlaceholder ? null : (
          <div className={styles.cellContents}>{cell.render('Cell')}</div>
        )}
      </div>
    </div>
  )
}

const CellWrapper: React.FC<{
  cell: Cell<Experiment, unknown>
  changes?: string[]
  cellId: string
}> = ({ cell, cellId, changes }) => (
  <div
    {...cell.getCellProps({
      className: cx(styles.td, cell.isPlaceholder && styles.groupPlaceholder, {
        [styles.metaCell]: !cell.column.group,
        [styles.workspaceChange]: changes?.includes(cell.column.id)
      })
    })}
    data-testid={cellId}
  >
    {cell.render('Cell')}
  </div>
)

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

export const RowContent: React.FC<
  RowProp & { className?: string } & WithChanges
> = ({
  row: {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    values: { id }
  },
  className,
  changes
}): JSX.Element => {
  const isWorkspace = id === 'workspace'
  const changesIfWorkspace = isWorkspace ? changes : undefined
  const toggleExperiment: EventHandler<SyntheticEvent> = e => {
    e.preventDefault()
    e.stopPropagation()
    sendMessage({
      payload: id,
      type: MessageFromWebviewType.EXPERIMENT_TOGGLED
    })
  }
  return (
    <div
      {...getRowProps({
        className: cx(
          className,
          styles.tr,
          getExperimentTypeClass(original),
          flatIndex % 2 === 0 || styles.oddRow,
          isWorkspace ? styles.workspaceRow : styles.normalRow,
          styles.row,
          isWorkspace && changes?.length && styles.workspaceWithChanges
        )
      })}
      tabIndex={0}
      role="row"
      onClick={toggleExperiment}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleExperiment(e)
        }
      }}
      data-testid={isWorkspace && 'workspace-row'}
    >
      <FirstCell cell={firstCell} bulletColor={original.displayColor} />
      {cells.map(cell => {
        const cellId = `${cell.column.id}___${cell.row.id}`
        return (
          <CellWrapper
            cell={cell}
            changes={changesIfWorkspace}
            key={cellId}
            cellId={cellId}
          />
        )
      })}
    </div>
  )
}
