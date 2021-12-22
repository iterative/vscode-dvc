import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import { Draggable } from 'react-beautiful-dnd'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import {
  countUpperLevels,
  getPlaceholders,
  isFirstLevelHeader
} from '../../util/columns'
import { sendMessage } from '../../../shared/vscode'

interface TableHeaderProps {
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
  index: number
  orderedColumns: MetricOrParam[]
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  sorts,
  index,
  orderedColumns
}) => {
  const nbPlaceholder = getPlaceholders(column, columns).length
  const hasPlaceholder = nbPlaceholder > 0
  const isSortedWithPlaceholder = (sort: SortDefinition) =>
    sort.path === column.placeholderOf?.id ||
    (!column.placeholderOf && !hasPlaceholder && sort.path === column.id)
  const isDraggable =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns
  const canResize = column.canResize && !column.placeholderOf
  const nbUpperLevels =
    (!column.placeholderOf &&
      countUpperLevels(orderedColumns, column, columns, 0)) ||
    0
  const resizerHeight = 100 + nbUpperLevels * 92 + '%'
  const isDescending = sorts.some(
    sort => sort.path === column.id && sort.descending
  )

  const sortDescending = (descending: boolean) => {
    sendMessage({
      payload: {
        descending,
        path: column.id
      },
      type: MessageFromWebviewType.COLUMN_SORT_REQUESTED
    })
  }

  const sortTable = () => {
    if (column.columns !== undefined) {
      return
    }

    const columnHasSorts =
      sorts.filter(sort => sort.path === column.id).length > 0
    if (!columnHasSorts) {
      return sortDescending(true)
    }

    if (isDescending) {
      sortDescending(!isDescending)
    } else {
      sendMessage({
        payload: { path: column.id },
        type: MessageFromWebviewType.COLUMN_REMOVE_SORT_REQUESTED
      })
    }
  }

  return (
    <Draggable
      key={column.id}
      draggableId={column.id}
      index={index}
      isDragDisabled={!isDraggable}
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
                [styles.paramHeaderCell]: column.id.includes('params'),
                [styles.metricHeaderCell]: column.id.includes('metric'),
                [styles.firstLevelHeader]: isFirstLevelHeader(column.id),
                [styles.sortingHeaderCellAsc]: sorts.filter(
                  sort => !sort.descending && isSortedWithPlaceholder(sort)
                ).length,
                [styles.sortingHeaderCellDesc]: sorts.filter(
                  sort => sort.descending && sort.path === column.id
                ).length
              }
            )
          })}
          key={column.id}
          data-testid={`header-${column.id}`}
          role="button"
          onClick={sortTable}
          onKeyDown={sortTable}
          tabIndex={index}
        >
          <div
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
          </div>
          {canResize && (
            <div
              {...column.getResizerProps()}
              className={styles.columnResizer}
              style={{ height: resizerHeight }}
            />
          )}
        </div>
      )}
    </Draggable>
  )
}
