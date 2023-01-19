import React from 'react'
import get from 'lodash/get'
import {
  createColumnHelper,
  AccessorFn,
  Column as TableColumn,
  ColumnDef,
  CellContext
} from '@tanstack/react-table'
import {
  Column,
  ColumnType,
  Experiment
} from 'dvc/src/experiments/webview/contract'
import { Header } from '../components/table/content/Header'
import { Cell, CellValue } from '../components/table/content/Cell'
import { TimestampHeader } from '../components/table/content/TimestampHeader'

export type ColumnWithGroup = ColumnDef<Experiment, unknown> & { group: string }

export const columnHelper = createColumnHelper<Column>()

const buildAccessor: (valuePath: string[]) => AccessorFn<Column> =
  pathArray => originalRow => {
    const value = get(originalRow, pathArray)

    if (!Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value
    }
    return `[${value.join(', ')}]`
  }

export const buildColumns = (
  properties: Column[],
  parentPath: string
): TableColumn<Experiment>[] => {
  return properties
    .filter(column => column.parentPath === parentPath)
    .map(data => {
      const { path, width, pathArray, label, type } = data

      const childColumns = buildColumns(properties, path)

      const mainColumnProperties = {
        group: type,
        header: () =>
          type === ColumnType.TIMESTAMP ? (
            <TimestampHeader />
          ) : (
            <Header name={label} />
          ),
        id: type === ColumnType.TIMESTAMP ? ColumnType.TIMESTAMP : path,
        width
      }

      if (childColumns.length > 0) {
        return columnHelper.group({
          ...mainColumnProperties,
          columns: childColumns
        })
      }

      return columnHelper.accessor(buildAccessor(pathArray || [path]), {
        ...mainColumnProperties,
        cell: Cell as unknown as React.FC<CellContext<Column, CellValue>>
      })
    })
    .filter(Boolean) as TableColumn<Experiment>[]
}
