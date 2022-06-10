import React from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import styles from './styles.module.scss'

export const Indicators = ({
  sorts,
  filters
}: {
  sorts?: SortDefinition[]
  filters?: string[]
}) => {
  return (
    <div className={styles.tableIndicators}>
      {sorts && sorts.length > 0 && (
        <div>
          {sorts.length} sort{sorts.length > 1 && 's'}
        </div>
      )}
      {filters && filters.length > 0 && (
        <div>
          {filters.length} filter{filters.length > 1 && 's'}
        </div>
      )}
    </div>
  )
}
