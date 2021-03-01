import { TableInstance, ColumnInstance } from 'react-table'
import styles from '../table-styles.module.scss'
import React from 'react'
import { Experiment } from '../Experiments'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

const ColumnOptionsRow: React.FC<{
  column: ColumnInstance<Experiment>
}> = ({ column }) => (
  <div>
    <span>{'-'.repeat(column.depth)}</span> <span>{column.Header}</span>
    {column.canSort && (
      <button {...column.getSortByToggleProps()}>
        Sort
        {column.isSorted && <> ({column.isSortedDesc ? 'DESC' : 'ASC'})</>}
      </button>
    )}
    {(!column.columns || column.columns.length === 0) && (
      <button
        onClick={() => {
          column.toggleHidden()
        }}
      >
        {column.isVisible ? 'Hide' : 'Show'}
      </button>
    )}
    {column.columns &&
      column.columns.map(childColumn => (
        <ColumnOptionsRow column={childColumn} key={childColumn.id} />
      ))}
  </div>
)

const SortIndicator: React.FC<InstanceProp> = ({ instance }) => {
  const { columns: columnInstances, sortedColumns } = instance
  return (
    <details className={styles.optionsPanel}>
      <summary>
        <b>Sort By</b>
        {/* <div>Sorted by:</div> */}
        <div>
          {sortedColumns.map(column => (
            <span key={column.id}>
              {column.render('Header')} ({column.isSortedDesc ? 'DESC' : 'ASC'})
            </span>
          ))}
        </div>
      </summary>
      {columnInstances.map(column => (
        <ColumnOptionsRow column={column} key={column.id} />
      ))}
    </details>
  )
}

export default SortIndicator
