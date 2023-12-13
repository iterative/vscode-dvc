import { flexRender } from '@tanstack/react-table'
import React, { ReactNode } from 'react'
import cx from 'classnames'
import styles from '../styles.module.scss'
import { CellValue, isValueWithChanges } from '../content/Cell'
import { CellProp } from '../../../util/interfaces'

const cellHasChanges = (cellValue: CellValue) =>
  isValueWithChanges(cellValue) ? cellValue.changes : false

export const CellWrapper: React.FC<
  CellProp & {
    error?: string
    changes?: string[]
    cellId: string
    children?: ReactNode
  }
> = ({ cell, cellId, changes }) => (
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
