import React from 'react'
import cx from 'classnames'
import { TableInstance } from 'react-table'
import {
  RowData as Experiment,
  TableData
} from 'dvc/src/experiments/webview/contract'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { ExperimentRow, RowProp, WithChanges } from './Row'
import { ExperimentGroup } from './Group'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export const TableBody: React.FC<RowProp & InstanceProp & WithChanges> = ({
  row,
  instance,
  changes
}) => {
  instance.prepareRow(row)
  return (
    <div
      {...instance.getTableBodyProps({
        className: cx(
          styles.rowGroup,
          styles.tbody,
          row.values.id === 'workspace'
            ? styles.workspaceRowGroup
            : styles.normalRowGroup
        )
      })}
    >
      <ExperimentRow row={row} changes={changes} />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <ExperimentGroup
            row={subRow}
            instance={instance}
            key={subRow.values.id}
          />
        ))}
    </div>
  )
}
export const Table: React.FC<{ tableData: TableData } & InstanceProp> = ({
  instance,
  tableData
}) => {
  const { getTableProps, rows } = instance
  const { sorts, columns, changes } = tableData
  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead instance={instance} sorts={sorts} columns={columns} />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            changes={changes}
          />
        ))}
      </div>
    </div>
  )
}
