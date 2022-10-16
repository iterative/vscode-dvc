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
import { ExperimentsState } from '../../../store'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'
import { MessagesMenu } from '../../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../../shared/components/messagesMenu/MessagesMenuOption'

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
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const sortOption = (
  label: SortOrder,
  currentSort: SortOrder,
  columnId: string
) => {
  const sortOrder = currentSort
  const hidden = sortOrder === label
  const descending = label === SortOrder.DESCENDING
  const path = columnId
  const removeSortMessage = {
    payload: columnId,
    type: MessageFromWebviewType.REMOVE_COLUMN_SORT
  }
  const payload = {
    descending,
    path
  }
  const message =
    label === SortOrder.NONE
      ? removeSortMessage
      : {
          payload,
          type: MessageFromWebviewType.SORT_COLUMN
        }

  return {
    hidden,
    id: label,
    label,
    message
  } as MessagesMenuOptionProps
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  orderedColumns,
  onDragEnter,
  onDragStart,
  onDrop,
  root,
  setExpColumnNeedsShadow
}) => {
  const { filters, sorts } = useSelector(
    (state: ExperimentsState) => state.tableData
  )
  const baseColumn = column.placeholderOf || column
  const sort = sorts.find(sort => sort.path === baseColumn.id)

  const hasFilter = !!(column.id && filters.includes(column.id))
  const isSortable =
    !column.placeholderOf && column.id !== 'id' && !column.columns

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
      },
      {
        id: 'update-header-depth',
        label: 'Set Max Header Height',
        message: {
          type: MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT
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
      setExpColumnNeedsShadow={setExpColumnNeedsShadow}
      menuContent={
        <div>
          <MessagesMenu options={contextMenuOptions} />
          {isSortable && (
            <>
              <VSCodeDivider />
              <MessagesMenu
                options={[
                  sortOption(SortOrder.ASCENDING, sortOrder, column.id),
                  sortOption(SortOrder.DESCENDING, sortOrder, column.id),
                  sortOption(SortOrder.NONE, sortOrder, column.id)
                ]}
              />
            </>
          )}
        </div>
      }
    />
  )
}
