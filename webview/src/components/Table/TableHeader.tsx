import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import { Draggable } from 'react-beautiful-dnd'
import styles from './styles.module.scss'
import { getPlaceholder, isFirstLevelHeader } from '../../util/columns'

interface TableHeaderProps {
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
  index: number
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  sorts,
  index
}) => {
  const hasPlaceholder = getPlaceholder(column, columns)
  const isSortedWithPlaceholder = (sort: SortDefinition) =>
    sort.path === column.placeholderOf?.id ||
    (!column.placeholderOf && !hasPlaceholder && sort.path === column.id)
  const isDraggable =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns

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
        >
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            data-testid="rendered-header"
            style={provided.draggableProps.style}
            className={cx({
              [styles.draggingColumn]: snapshot.isDragging,
              [styles.staticColumn]: !snapshot.isDragging,
              [styles.isDroppedColumn]: snapshot.isDropAnimating
            })}
          >
            {column.render('Header')}
          </div>
        </div>
      )}
    </Draggable>
  )
}
