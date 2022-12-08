import React from 'react'
import cx from 'classnames'
import { ErrorTooltip } from './Errors'
import styles from './styles.module.scss'
import { CellProp, RowProp } from './interfaces'
import { CellRowActionsProps, CellRowActions } from './CellRowActions'
import { clickAndEnterProps } from '../../../util/props'
import { cellHasChanges } from '../../util/buildDynamicColumns'

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
  CellProp & CellRowActionsProps & { changesIfWorkspace: boolean }
> = ({ cell, changesIfWorkspace, ...rowActionsProps }) => {
  const { row, isPlaceholder } = cell
  const {
    original: { error, status, label, displayNameOrParent = '' }
  } = row
  const { toggleExperiment } = rowActionsProps

  return (
    <div
      {...cell.getCellProps({
        className: cx(styles.td, styles.experimentCell)
      })}
    >
      <div className={styles.innerCell}>
        <CellRowActions status={status} {...rowActionsProps} />
        <RowExpansionButton row={row} />
        {isPlaceholder ? null : (
          <ErrorTooltip error={error}>
            <div
              className={cx(styles.experimentCellContentsContainer, {
                [styles.workspaceChange]: changesIfWorkspace,
                [styles.error]: error
              })}
              {...clickAndEnterProps(toggleExperiment, [
                label,
                displayNameOrParent
              ])}
            >
              {cell.render('Cell')}
            </div>
          </ErrorTooltip>
        )}
      </div>
    </div>
  )
}

export const CellWrapper: React.FC<
  CellProp & {
    error?: string
    changes?: string[]
    cellId: string
    children?: React.ReactNode
  }
> = ({ cell, cellId, changes }) => {
  return (
    <div
      {...cell.getCellProps({
        className: cx(styles.td, {
          [styles.workspaceChange]: changes?.includes(cell.column.id),
          [styles.depChange]: cellHasChanges(cell.value)
        })
      })}
      data-testid={cellId}
    >
      {cell.render('Cell')}
    </div>
  )
}
