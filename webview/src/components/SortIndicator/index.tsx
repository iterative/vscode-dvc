import React from 'react'
import { InstanceProp } from '../Table/index'
import styles from './module.scss'

const SortIndicator: React.FC<InstanceProp> = ({ instance }) => {
  const sortedByColumn = instance.sortedColumns.length
    ? instance.sortedColumns[0]
    : null
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
            {sortedBy.isSortedDesc ? (
              <svg
                fill="currentColor"
                height="1em"
                width="1em"
                viewBox="0 0 256 512"
                aria-hidden="true"
                role="img"
                style={{ verticalAlign: -0.125 + 'em' }}
              >
                <path d="M168 345.941V44c0-6.627-5.373-12-12-12h-56c-6.627 0-12 5.373-12 12v301.941H41.941c-21.382 0-32.09 25.851-16.971 40.971l86.059 86.059c9.373 9.373 24.569 9.373 33.941 0l86.059-86.059c15.119-15.119 4.411-40.971-16.971-40.971H168z"></path>
              </svg>
            ) : (
              <svg
                fill="currentColor"
                height="1em"
                width="1em"
                viewBox="0 0 256 512"
                aria-hidden="true"
                role="img"
                style={{ verticalAlign: -0.125 + 'em' }}
              >
                <path d="M88 166.059V468c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12V166.059h46.059c21.382 0 32.09-25.851 16.971-40.971l-86.059-86.059c-9.373-9.373-24.569-9.373-33.941 0l-86.059 86.059c-15.119 15.119-4.411 40.971 16.971 40.971H88z"></path>
              </svg>
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
