import {
  Experiment,
  Column,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { HeaderGroup } from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import { TableHeaderCell } from './TableHeaderCell'
import { ExperimentsState } from '../../store'
import { DragFunction } from '../../../shared/components/dragDrop/Draggable'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'

export enum SortOrder {
  ASCENDING = 'Sort Ascending',
  DESCENDING = 'Sort Descending',
  NONE = 'Remove Sort'
}

const possibleOrders = {
  false: SortOrder.ASCENDING,
  true: SortOrder.DESCENDING,
  undefined: SortOrder.NONE
} as const

interface TableHeaderProps {
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  firstExpColumnCellId: string
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  orderedColumns,
  onDragEnter,
  onDragStart,
  onDrop,
  root,
  firstExpColumnCellId,
  setExpColumnNeedsShadow
}) => {
  const { filters, sorts } = useSelector(
    (state: ExperimentsState) => state.tableData
  )
  const baseColumn = column.placeholderOf || column
  const sort = sorts.find(sort => sort.path === baseColumn.id)

  const hasFilter = !!(column.id && filters.includes(column.id))
  const isSortable =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns

  const sortOrder: SortOrder = possibleOrders[`${sort?.descending}`]

  const contextMenuOptions: MessagesMenuOptionProps[] = React.useMemo(() => {
    const menuOptions: MessagesMenuOptionProps[] = [
      {
        hidden: !!column.headers,
        id: 'hide-column',
        label: 'Hide Column',
        message: {
          payload: column.id,
          type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
        }
      },
      {
        hidden: column.group !== ColumnType.PARAMS,
        id: 'open-to-the-side',
        label: 'Open to the Side',
        message: {
          payload: column.id,
          type: MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE
        }
      }
    ]

    return menuOptions
  }, [column])

  return (
    <TableHeaderCell
      column={column}
      columns={columns}
      orderedColumns={orderedColumns}
      sortOrder={sortOrder}
      sortEnabled={isSortable}
      hasFilter={hasFilter}
      onDragEnter={onDragEnter}
      onDragStart={onDragStart}
      onDrop={onDrop}
      menuDisabled={!isSortable && column.group !== ColumnType.PARAMS}
      root={root}
      firstExpColumnCellId={firstExpColumnCellId}
      setExpColumnNeedsShadow={setExpColumnNeedsShadow}
      menuContent={
        <div>
          <MessagesMenu options={contextMenuOptions} />
          <VSCodeDivider />
          <MessagesMenu
            options={[
              {
                hidden: sortOrder === SortOrder.ASCENDING,
                id: SortOrder.ASCENDING,
                label: SortOrder.ASCENDING,
                message: {
                  payload: {
                    descending: false,
                    path: column.id
                  },
                  type: MessageFromWebviewType.SORT_COLUMN
                }
              },
              {
                hidden: sortOrder === SortOrder.DESCENDING,
                id: SortOrder.DESCENDING,
                label: SortOrder.DESCENDING,
                message: {
                  payload: {
                    descending: true,
                    path: column.id
                  },
                  type: MessageFromWebviewType.SORT_COLUMN
                }
              },
              {
                hidden: sortOrder === SortOrder.NONE,
                id: SortOrder.NONE,
                label: SortOrder.NONE,
                message: {
                  payload: column.id,
                  type: MessageFromWebviewType.REMOVE_COLUMN_SORT
                }
              }
            ]}
          />
        </div>
      }
    />
  )
}
