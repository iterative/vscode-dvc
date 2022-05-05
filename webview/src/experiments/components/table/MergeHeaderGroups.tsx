import React from 'react'
import cx from 'classnames'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { DragDropContext, Droppable, Responders } from 'react-beautiful-dnd'
import { TableHeader } from './TableHeader'
import styles from './styles.module.scss'

export const MergedHeaderGroup: React.FC<
  {
    headerGroup: HeaderGroup<Experiment>
    columns: HeaderGroup<Experiment>[]
    sorts: SortDefinition[]
    orderedColumns: Column[]
  } & Responders
> = ({
  headerGroup,
  sorts,
  columns,
  orderedColumns,
  onDragStart,
  onDragUpdate,
  onDragEnd
}) => {
  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
    >
      <Droppable droppableId="droppable" direction="horizontal">
        {provided => (
          <div
            ref={provided.innerRef}
            {...headerGroup.getHeaderGroupProps({
              className: cx(styles.tr, styles.headerRow)
            })}
          >
            {headerGroup.headers.map((column: HeaderGroup<Experiment>, i) => (
              <TableHeader
                orderedColumns={orderedColumns}
                key={column.id}
                column={column}
                columns={columns}
                sorts={sorts}
                index={i}
              />
            ))}
            <div className={styles.dndPlaceholder}>{provided.placeholder}</div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
