import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import cx from 'classnames'
import { Cell } from 'react-table'
import { RowProp } from './Row'
import styles from './styles.module.scss'
import { CellTooltip } from '../cell/CellTooltip'
import { CopyButton } from '../copyButton/CopyButton'
import Tooltip, {
  CELL_TOOLTIP_DELAY,
  TooltipArrow,
  TooltipBox
} from '../../../shared/components/tooltip/Tooltip'
import { formatFloat } from '../../util/numberFormatting'
import ClockIcon from '../../../shared/components/icons/Clock'

const UndefinedCell = (
  <div className={styles.innerCell}>
    <span className={styles.cellContents}>. . .</span>
  </div>
)

export const CellComponent: React.FC<
  Cell<Experiment, string | number>
> = cell => {
  const { value } = cell
  if (value === undefined) {
    return UndefinedCell
  }

  const stringValue = String(value)

  const displayValue =
    typeof value === 'number' && !Number.isInteger(value)
      ? formatFloat(value as number)
      : stringValue

  return (
    <Tooltip
      render={attrs => (
        <TooltipBox {...attrs}>
          <CellTooltip cell={cell} />
          <TooltipArrow />
        </TooltipBox>
      )}
      placement="bottom"
      arrow={true}
      delay={[CELL_TOOLTIP_DELAY, 0]}
    >
      <div className={styles.innerCell}>
        <CopyButton value={stringValue} />
        <span className={styles.cellContents}>{displayValue}</span>
      </div>
    </Tooltip>
  )
}

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

export const FirstCell: React.FC<{
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

export const CellWrapper: React.FC<{
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
