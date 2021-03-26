import React from 'react'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import Fuse from 'fuse.js'
import { minWordLength } from '../../util/strings'
import { DragDots, MenuItem, MenuSeparator } from '../Menu'
import styles from './styles.module.scss'

export interface ColumnRowProps {
  searchTerm: string | null
  column: ColumnInstance<Experiment>
  showAll?: boolean
  onToggle?: (column: ColumnInstance<Experiment>) => void
}

const columnIsParent = (
  col: ColumnInstance<Experiment>
): col is ColumnInstance<Experiment> & {
  columns: ColumnInstance<Experiment>[]
} => {
  return !col.canSort
}

const columnMatchesSearch = (
  column: ColumnInstance<Experiment>,
  searchTerm: string | null
) => {
  if (searchTerm === null) {
    return true
  }
  const fuse = new Fuse([column.id, column.Header], {
    ignoreLocation: true,
    useExtendedSearch: true,
    minMatchCharLength: minWordLength(searchTerm)
  })
  return Boolean(fuse.search(searchTerm).length)
}

const hasVisibleDescendent = (
  column: ColumnInstance<Experiment>,
  searchTerm: string | null
) => {
  if (columnMatchesSearch(column, searchTerm)) {
    return true
  }
  if (column.columns) {
    for (const c of column.columns) {
      if (hasVisibleDescendent(c, searchTerm)) {
        return true
      }
    }
  }
  return false
}

export const ColumnRows: React.FC<ColumnRowProps> = ({
  column,
  searchTerm,
  showAll,
  onToggle
}) => {
  if (!showAll && !hasVisibleDescendent(column, searchTerm)) {
    return null
  }

  if (columnIsParent(column)) {
    return (
      <>
        <MenuSeparator key={column.id} />
        <span
          key={`${column.id}-column-group`}
          className={styles.manageColumns__columnGroup}
        >
          <span
            key={`column-${column.Header}-span`}
            style={{ width: 10 * column.depth }}
          />
          {column.Header}
        </span>
        {column.columns.map(c => (
          <ColumnRows
            key={c.id}
            searchTerm={searchTerm}
            column={c}
            showAll
            onToggle={onToggle}
          />
        ))}
      </>
    )
  } else {
    return (
      <MenuItem
        id={column.id}
        key={`manage-column-${column.id}`}
        onClick={() => onToggle && onToggle(column)}
      >
        <span
          key={`column-${column.Header}-span`}
          style={{ width: 10 * column.depth }}
        />
        <DragDots />
        {column.Header}
        <input
          type="checkbox"
          id={column.id}
          checked={column.isVisible}
          readOnly
          key={`manage-column-input-${column.id}`}
        />
      </MenuItem>
    )
  }
}
