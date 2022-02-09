import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import React from 'react'
import styles from './styles.module.scss'
import { countUpperLevels } from '../../util/columns'

interface TableHeaderResizerProps {
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: MetricOrParam[]
}

export const TableHeaderResizer: React.FC<TableHeaderResizerProps> = ({
  column,
  columns,
  orderedColumns
}) => {
  if (!column.canResize || column.placeholderOf) {
    return null
  }
  const nbUpperLevels =
    (!column.placeholderOf &&
      countUpperLevels(orderedColumns, column, columns, 0)) ||
    0
  const resizerHeight = 100 + nbUpperLevels * 92 + '%'
  return (
    <div
      {...column.getResizerProps()}
      className={styles.columnResizer}
      style={{ height: resizerHeight }}
    />
  )
}
