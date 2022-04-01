import React from 'react'
import { TableInstance } from 'react-table'
import {
  RowData as Experiment,
  TableData
} from 'dvc/src/experiments/webview/contract'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { TableBody } from '../row/Row'

export interface InstanceProp {
  instance: TableInstance<Experiment>
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
