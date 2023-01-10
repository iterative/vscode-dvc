import React from 'react'
import get from 'lodash/get'
import {
  createColumnHelper,
  AccessorFn,
  Column as TableColumn,
  HeaderContext
} from '@tanstack/react-table'
import {
  Column,
  ColumnType,
  Experiment
} from 'dvc/src/experiments/webview/contract'
import { Header } from '../components/table/content/Header'
import { Cell } from '../components/table/content/Cell'
import { TimestampHeader } from '../components/table/content/TimestampHeader'

export const columnHelper = createColumnHelper<Column>()

const buildAccessor: (valuePath: string[]) => AccessorFn<Column> =
  pathArray => originalRow => {
    const value = get(originalRow, pathArray)

    if (!Array.isArray(value)) {
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
        header: (context: HeaderContext<Column, unknown>) =>
          type === ColumnType.TIMESTAMP ? (
            <TimestampHeader isPlaceholder={context.header.isPlaceholder} />
          ) : (
            <Header name={label} context={context} />
          ),
        id: path,
        group: type,
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
        cell: Cell
      })
    })
    .filter(Boolean) as TableColumn<Experiment>[]
}
