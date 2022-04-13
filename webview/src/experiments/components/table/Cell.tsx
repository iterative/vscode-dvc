import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { CellProp, RowProp } from './interfaces'
import ClockIcon from '../../../shared/components/icons/Clock'

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

export const FirstCell: React.FC<
  CellProp & {
    bulletColor?: string
  }
> = ({ cell, bulletColor }) => {
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

export const CellWrapper: React.FC<
  CellProp & {
    changes?: string[]
    cellId: string
  }
> = ({ cell, cellId, changes }) => (
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
