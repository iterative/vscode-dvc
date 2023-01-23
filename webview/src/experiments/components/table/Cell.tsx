import { flexRender } from '@tanstack/react-table'
import React, { ReactNode } from 'react'
import cx from 'classnames'
import { ErrorTooltip } from './Errors'
import styles from './styles.module.scss'
import { CellProp, RowProp } from './interfaces'
import { CellRowActionsProps, CellRowActions } from './CellRowActions'
import { CellValue, isValueWithChanges } from './content/Cell'
import { clickAndEnterProps } from '../../../util/props'

const cellHasChanges = (cellValue: CellValue) =>
  isValueWithChanges(cellValue) ? cellValue.changes : false

const RowExpansionButton: React.FC<RowProp> = ({ row }) =>
  row.getCanExpand() ? (
    <button
      title={`${row.getIsExpanded() ? 'Contract' : 'Expand'} Row`}
      className={styles.rowArrowContainer}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        row.toggleExpanded()
      }}
      onKeyDown={e => {
        e.stopPropagation()
      }}
    >
      <span
        className={
          row.getIsExpanded()
            ? styles.expandedRowArrow
            : styles.contractedRowArrow
        }
      />
    </button>
  ) : (
    <span className={styles.rowArrowContainer} />
  )

export const FirstCell: React.FC<
  CellProp & CellRowActionsProps & { changesIfWorkspace: boolean }
> = ({ cell, changesIfWorkspace, ...rowActionsProps }) => {
  const {
    row,
    getIsPlaceholder,
    getContext,
    column: {
      getSize,
      columnDef: { cell: columnCell }
    }
  } = cell
  const {
    original: { error, status, label, id, displayNameOrParent = '' }
  } = row
  const { toggleExperiment } = rowActionsProps

  return (
    <td className={styles.experimentCell}>
      <div className={styles.innerCell} style={{ width: getSize() }}>
        <CellRowActions status={status} {...rowActionsProps} />
        <RowExpansionButton row={row} />
        {getIsPlaceholder() ? null : (
          <ErrorTooltip error={error}>
            <div
              className={cx(styles.experimentCellContentsContainer, {
                [styles.workspaceChange]: changesIfWorkspace,
                [styles.error]: error
              })}
              {...clickAndEnterProps(
                toggleExperiment,
                [label, displayNameOrParent],
                true
              )}
              data-testid={`id___${id}`}
            >
              {flexRender(columnCell, getContext())}
            </div>
          </ErrorTooltip>
        )}
      </div>
    </td>
  )
}

export const CellWrapper: React.FC<
  CellProp & {
    error?: string
    changes?: string[]
    cellId: string
    children?: ReactNode
  }
> = ({ cell, cellId, changes }) => {
  return (
    <td
      className={cx({
        [styles.workspaceChange]: changes?.includes(cell.column.id),
        [styles.depChange]: cellHasChanges(cell.getValue() as CellValue)
      })}
      data-testid={cellId}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  )
}
