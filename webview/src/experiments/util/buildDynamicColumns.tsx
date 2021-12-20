import React from 'react'
import get from 'lodash/get'
import { Column, Accessor, ColumnGroup } from 'react-table'
import { splitMetricOrParamPath } from 'dvc/src/experiments/metricsAndParams/paths'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { formatFloat } from './numberFormatting'
import styles from '../components/Table/styles.module.scss'
import { CopyButton } from '../components/CopyButton'

type Value = string | number

const UndefinedCell = <>. . .</>

const Cell: React.FC<{ value: Value }> = ({ value }) => {
  if (value === undefined) {
    return UndefinedCell
  }

  const displayValue =
    typeof value === 'number' && !Number.isInteger(value)
      ? formatFloat(value as number)
      : String(value)

  return (
    <>
      <span className={styles.cellContents}>{displayValue}</span>
      <CopyButton value={displayValue} />
    </>
  )
}

const getCellComponent = (): React.FC<{ value: Value }> => Cell

const buildAccessor: (valuePath: string[]) => Accessor<Experiment> =
  pathArray => originalRow =>
    get(originalRow, pathArray)

const buildDynamicColumns = (
  properties: MetricOrParam[],
  parentPath: string
): Column<Experiment>[] =>
  properties
    .filter(column => column.parentPath === parentPath)
    .map(data => {
      const { path } = data

      const Cell = getCellComponent()
      const childColumns = buildDynamicColumns(properties, path)

      const pathArray = splitMetricOrParamPath(path)

      const column: ColumnGroup<Experiment> | Column<Experiment> = {
        Cell,
        Header: data.name,
        accessor: buildAccessor(pathArray),
        columns: childColumns.length ? childColumns : undefined,
        id: path
      }
      return column
    })

export default buildDynamicColumns
