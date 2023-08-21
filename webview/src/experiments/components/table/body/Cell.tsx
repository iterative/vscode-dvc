import { flexRender } from '@tanstack/react-table'
import React, { ReactNode } from 'react'
import cx from 'classnames'
import { CellRowActionsProps, CellRowActions } from './CellRowActions'
import { ExperimentStatusIndicator } from './ExperimentStatusIndicator'
import styles from '../styles.module.scss'
import { CellValue, isValueWithChanges } from '../content/Cell'
import { CellProp, RowProp } from '../../../util/interfaces'
import { ErrorTooltip } from '../../../../shared/components/tooltip/ErrorTooltip'

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
    <span className={styles.emptyRowArrowContainer} />
  )

export const StubCell: React.FC<
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
    original: { error, executorStatus, gitRemoteStatus, id }
  } = row

  return (
    <td className={cx(styles.experimentsTd, styles.experimentCell)}>
      <div className={styles.innerCell} style={{ width: getSize() }}>
        <CellRowActions executorStatus={executorStatus} {...rowActionsProps} />
        <RowExpansionButton row={row} />
        <ExperimentStatusIndicator
          id={id}
          executorStatus={executorStatus}
          gitRemoteStatus={gitRemoteStatus}
        />

        {getIsPlaceholder() ? null : (
          <ErrorTooltip error={error}>
            <div
              className={cx(styles.experimentCellTextWrapper, {
                [styles.workspaceChangeText]: changesIfWorkspace,
                [styles.errorText]: error
              })}
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
      className={cx(styles.experimentsTd, {
        [styles.workspaceChangeText]: changes?.includes(cell.column.id),
        [styles.depChangeText]: cellHasChanges(cell.getValue() as CellValue)
      })}
      data-testid={cellId}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  )
}
