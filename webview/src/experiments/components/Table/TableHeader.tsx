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
import { countUpperLevels, isFirstLevelHeader } from '../../util/columns'
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const isLeaf =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns
  const canResize = column.canResize && !column.placeholderOf
  const nbUpperLevels =
    (!column.placeholderOf &&
      countUpperLevels(orderedColumns, column, columns, 0)) ||
    0
  const resizerHeight = 100 + nbUpperLevels * 92 + '%'
  const isSortAscending = !!sorts.find(
    sort => !sort.descending && sort.path === column.id
  )
  const isSortDescending =
    !isSortAscending &&
    !!sorts.find(sort => sort.descending && sort.path === column.id)
  const nextSortTypeIfNotAscending = isSortDescending
    ? ColumnSortType.REMOVE
    : ColumnSortType.ASCENDING
  const doSendSortColumn = () =>
    sendMessage({
      payload: {
        columnId: column.id,
        columnSortType: isSortAscending
          ? ColumnSortType.DESCENDING
          : nextSortTypeIfNotAscending
      },
      type: MessageFromWebviewType.COLUMN_SORTED
    })
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
        <button
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
          onClick={sendSortColumn}
          key={column.id}
          data-testid={`header-${column.id}`}
        >
          <div className={styles.headerCellContentsWrapper}>
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
          </div>
          {canResize && (
            <div
              {...column.getResizerProps()}
              className={styles.columnResizer}
              style={{ height: resizerHeight }}
            />
          )}
          <div
            className={cx(styles.headerCellSortIcon, {
              [styles.sortAscending]: isSortAscending,
              [styles.sortDescending]: isSortDescending
            })}
            onKeyDown={sendSortColumn}
            role="button"
            tabIndex={0}
            data-testid={`header-sort-indicator-${column.id}`}
          ></div>
        </button>
      )}
    </Draggable>
  )
}
