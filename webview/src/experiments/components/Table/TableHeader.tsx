import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import { Draggable } from 'react-beautiful-dnd'
import {
  ColumnSortType,
  MessageFromWebviewType
} from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { TableHeaderResizer } from './TableHeaderResizer'
import { isFirstLevelHeader } from '../../util/columns'
import { sendMessage } from '../../../shared/vscode'

interface TableHeaderProps {
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
  index: number
  orderedColumns: MetricOrParam[]
  isDragging: boolean
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  sorts,
  index,
  orderedColumns,
  isDragging
}) => {
  const isLeaf =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns
  const isSortAscending = !!sorts.find(
    sort => !sort.descending && sort.path === column.id
  )
  const isSortDescending =
    !isSortAscending &&
    !!sorts.find(sort => sort.descending && sort.path === column.id)
  const doSendSortColumn = () => {
    let nextSortType = isSortAscending
      ? ColumnSortType.DESCENDING
      : ColumnSortType.ASCENDING
    nextSortType = isSortDescending ? ColumnSortType.REMOVE : nextSortType
    sendMessage({
      payload: {
        columnId: column.id,
        columnSortType: nextSortType
      },
      type: MessageFromWebviewType.COLUMN_SORTED
    })
  }
  const sendSortColumn = () => {
    if (isLeaf && !isDragging) {
      doSendSortColumn()
    }
  }

  return (
    <Draggable
      key={column.id}
      draggableId={column.id}
      index={index}
      isDragDisabled={!isLeaf}
    >
      {(provided, snapshot) => (
        <div
          {...column.getHeaderProps({
            className: cx(
              styles.th,
              column.placeholderOf
                ? styles.placeholderHeaderCell
                : styles.headerCell,
              {
                [styles.paramHeaderCell]: column.group === 'params',
                [styles.metricHeaderCell]: column.group === 'metrics',
                [styles.firstLevelHeader]: isFirstLevelHeader(column.id)
              }
            )
          })}
          key={column.id}
          data-testid={`header-${column.id}`}
        >
          <button
            className={styles.headerCellContentsWrapper}
            onClick={sendSortColumn}
            data-testid={`header-sort-${column.id}`}
          >
            <span
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              data-testid="rendered-header"
              style={provided.draggableProps.style}
              className={cx(styles.cellContents, {
                [styles.draggingColumn]: snapshot.isDragging,
                [styles.staticColumn]: !snapshot.isDragging,
                [styles.isDroppedColumn]: snapshot.isDropAnimating
              })}
            >
              {column.render('Header')}
            </span>
          </button>
          <TableHeaderResizer
            column={column}
            columns={columns}
            orderedColumns={orderedColumns}
          />
          <div
            className={cx(styles.headerCellSortIcon, {
              [styles.sortAscending]: isSortAscending,
              [styles.sortDescending]: isSortDescending
            })}
            data-testid={`header-sort-indicator-${column.id}`}
          ></div>
        </div>
      )}
    </Draggable>
  )
}
