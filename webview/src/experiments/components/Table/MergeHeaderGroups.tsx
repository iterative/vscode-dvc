import React from 'react'
import cx from 'classnames'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { Droppable } from 'react-beautiful-dnd'
import { TableHeader } from './TableHeader'
import styles from './styles.module.scss'
import { Model } from '../../model'

export const MergedHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
  model: Model
}> = ({ headerGroup, sorts, columns, model }) => {
  return (
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
              model={model}
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
  )
}
