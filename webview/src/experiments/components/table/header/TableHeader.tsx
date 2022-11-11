import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { HeaderGroup } from 'react-table'
import { TableHeaderCell } from './TableHeaderCell'
import { ExperimentsState } from '../../../store'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

interface TableHeaderProps {
  column: HeaderGroup<Experiment> & { originalId?: string }
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  orderedColumns,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  root,
  setExpColumnNeedsShadow
}) => {
  const { filters } = useSelector((state: ExperimentsState) => state.tableData)

  const hasFilter = !!(column.id && filters.includes(column.id))

  const isSortable =
    !column.placeholderOf && column.id !== 'id' && !column.columns

  const sortOrder: SortOrder = possibleOrders[`${sort?.descending}`]

  const contextMenuOptions: MessagesMenuOptionProps[] = React.useMemo(() => {
    const menuOptions: MessagesMenuOptionProps[] = [
      {
        hidden: column.id === 'id',
        id: 'hide-column',
        label: 'Hide Column',
        message: {
          payload: column.originalId || column.id,
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

  const visibleOptions: number = React.useMemo(
    () => contextMenuOptions.filter(option => !option.hidden).length,
    [contextMenuOptions]
  )

  return (
    <TableHeaderCell
      column={column}
      columns={columns}
      orderedColumns={orderedColumns}
      hasFilter={hasFilter}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDrop={onDrop}
      menuDisabled={!isSortable && visibleOptions === 0}
      root={root}
      setExpColumnNeedsShadow={setExpColumnNeedsShadow}
    />
  )
}
