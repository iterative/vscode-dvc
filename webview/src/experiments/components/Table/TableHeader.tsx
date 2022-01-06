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
  const isParam = column.group === 'params'
  const isMetric = column.group === 'metrics'
  const isParamOrMetric = isParam || isMetric
  const columnSort = sorts.find(sort => sort.path === column.id)

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
    if (column.columns || !isParamOrMetric) {
      return
    }

    if (!columnSort) {
      return sortDescending(true)
    }

    if (columnSort.descending) {
      sortDescending(!columnSort.descending)
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
                [styles.paramHeaderCell]: isParam,
                [styles.metricHeaderCell]: isMetric,
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
            role="button"
            onClick={sortTable}
            onKeyDown={event => event.key === 'Enter' && sortTable()}
            tabIndex={0}
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
