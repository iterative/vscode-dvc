import React from 'react'
import get from 'lodash/get'
import {
  createColumnHelper,
  AccessorFn,
  Column as TableColumn,
  ColumnDef,
  CellContext
} from '@tanstack/react-table'
import { ColumnType, Experiment } from 'dvc/src/experiments/webview/contract'
import {
  EXPERIMENT_COLUMN_ID,
  GIT_INFO_COLUMN_ID
} from 'dvc/src/experiments/columns/constants'
import { Header } from '../../content/Header'
import { Cell, CellValue } from '../../content/Cell'
import { Column, Columns } from '../../../../state/tableDataSlice'
import { DateCellContents } from '../../content/DateCellContent'
import { TimestampHeader } from '../../content/TimestampHeader'
import { ExperimentCell } from '../../content/ExperimentCell'
import { ExperimentHeader } from '../../content/ExperimentHeader'
import { GitInfoHeader } from '../../content/GitInfoHeader'
import { GitInfoCellContent } from '../../content/GitInfoCellContent'

export type ColumnWithGroup = ColumnDef<Experiment, unknown> & {
  group: ColumnType
}

const columnHelper = createColumnHelper<Column>()

const getDefaultColumns = (flattenTable: boolean) => {
  const columns = [
    columnHelper.accessor(() => EXPERIMENT_COLUMN_ID, {
      cell: (cell: CellContext<Column, CellValue>) => {
        const {
          row: {
            original: { label, description, commit, sha, error }
          }
        } = cell as unknown as CellContext<Experiment, CellValue>
        return (
          <ExperimentCell
            commit={commit}
            description={description}
            error={error}
            label={label}
            sha={sha}
          />
        )
      },
      header: ExperimentHeader,
      id: EXPERIMENT_COLUMN_ID,
      minSize: 230,
      size: 240
    })
  ]

  if (flattenTable) {
    columns.push(
      columnHelper.accessor(() => GIT_INFO_COLUMN_ID, {
        cell: GitInfoCellContent as unknown as React.FC<
          CellContext<Column, CellValue>
        >,
        header: GitInfoHeader,
        id: GIT_INFO_COLUMN_ID,
        minSize: 100,
        size: 100
      })
    )
  }

  return columns
}

const buildAccessor: (valuePath: string[]) => AccessorFn<Column> =
  pathArray => originalRow => {
    const value = get(originalRow, pathArray)

    if (!Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value
    }
    return `[${value.join(', ')}]`
  }

const getTimestampColumn = (columns: Columns) => {
  const includeTimestamp = columns[ColumnType.TIMESTAMP]?.length > 0

  return includeTimestamp
    ? [
        columnHelper.accessor(buildAccessor(['Created']), {
          cell: DateCellContents as unknown as React.FC<
            CellContext<Column, CellValue>
          >,
          header: () => <TimestampHeader />,
          id: 'Created',
          size: 100
        })
      ]
    : []
}

const getMainColumnProperties = (
  type: ColumnType,
  label: string,
  path: string,
  size?: number
) => {
  const basicProperties = {
    group: type
  }
  const sizeProperty = size ? { size } : {}

  return {
    ...basicProperties,
    ...sizeProperty,
    cell: Cell as unknown as React.FC<CellContext<Column, CellValue>>,
    header: () => <Header name={label} />,
    id: path
  }
}

const buildColumnsType = (
  columns: Columns,
  parentPath: string
): TableColumn<Experiment>[] => {
  return (columns[parentPath] || [])
    .map(data => {
      const { path, width, pathArray, label, type } = data

      const childColumns = buildColumnsType(columns, path)
      const mainColumnProperties = getMainColumnProperties(
        type,
        label,
        path,
        width
      )

      if (childColumns?.length > 0) {
        return columnHelper.group({
          ...mainColumnProperties,
          cell: undefined,
          columns: childColumns
        })
      }

      return columnHelper.accessor(buildAccessor(pathArray || [path]), {
        ...mainColumnProperties
      })
    })
    .filter(Boolean) as TableColumn<Experiment>[]
}

export const buildColumns = (
  columns: Columns,
  flattenTable: boolean
): ColumnDef<Column, string>[] => {
  return [
    ...getDefaultColumns(flattenTable),
    ...getTimestampColumn(columns),
    ...buildColumnsType(columns, ColumnType.METRICS),
    ...buildColumnsType(columns, ColumnType.PARAMS),
    ...buildColumnsType(columns, ColumnType.DEPS)
  ]
}
