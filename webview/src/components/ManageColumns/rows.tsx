import React from 'react'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import Fuse from 'fuse.js'
import { minWordLength } from '../../util/strings'
import { Chevron, DragDots, MenuItem } from '../Menu'

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
  const [collapsed, setCollapsed] = React.useState(false)

  if (!showAll && !hasVisibleDescendent(column, searchTerm)) {
    return null
  }

  const handleDropdownClick = () => {
    setCollapsed(!collapsed)
  }

  if (columnIsParent(column)) {
    return (
      <div>
        <MenuItem
          id={column.id}
          key={`manage-column-${column.id}`}
          onClick={handleDropdownClick}
        >
          <span
            key={`column-${column.Header}-span`}
            style={{ width: 10 * column.depth }}
          />
          <DragDots />
          <Chevron open={!collapsed} />
          {column.Header}
          <input
            type="checkbox"
            id={column.id}
            checked={column.isVisible}
            readOnly
            key={`manage-column-input-${column.id}`}
          />
        </MenuItem>
        {!collapsed &&
          column.columns.map(c => (
            <ColumnRows
              key={c.id}
              searchTerm={searchTerm}
              column={c}
              showAll={showAll || columnMatchesSearch(column, searchTerm)}
              onToggle={onToggle}
            />
          ))}
      </div>
    )
  } else {
    return (
      <div>
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
      </div>
    )
  }
}
