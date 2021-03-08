import React from 'react'
import { InstanceProp } from '../Table/index'
import styles from './styles.module.scss'
import SortIconToggle from '../SortIconToggle'

const SortIndicator: React.FC<InstanceProp> = ({ instance }) => {
  const sortedByColumn = instance.sortedColumns.length
    ? instance.sortedColumns[0]
    : undefined

  const sortedBy = {
    header: sortedByColumn && sortedByColumn.Header,
    isSortedDesc: sortedByColumn && sortedByColumn.isSortedDesc
  }

  return (
    <div className={styles.sortIndicator}>
      <span className={styles.sortIndicator__text}>Sorted By</span>
      <span className={styles.sortIndicator__subText}>
        {sortedByColumn ? (
          <>
            {sortedBy.header}
            {sortedByColumn && (
              <SortIconToggle isSortedDesc={sortedBy.isSortedDesc} />
            )}
          </>
        ) : (
          'None'
        )}
      </span>
    </div>
  )
}

export default SortIndicator
