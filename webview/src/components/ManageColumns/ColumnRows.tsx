import React from 'react'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import { isPathLikeSearchHit } from '../../util/strings'
import { Chevron, DragDots, MenuItem } from '../Menu'
import styles from './styles.module.scss'
import { Button } from '../Button'

export interface ColumnRowProps {
  searchTerm: string | null
  column: ColumnInstance<Experiment>
  showAll?: boolean
  onToggle?: (column: ColumnInstance<Experiment>) => void
  ancestorHover?: boolean
  tabIndex?: number
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
  if (typeof column.Header === 'string') {
    if (isPathLikeSearchHit(column.Header, searchTerm)) {
      return true
    }
  }
  return isPathLikeSearchHit(column.id, searchTerm)
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
  ancestorHover,
  onToggle
}) => {
  const [collapsed, setCollapsed] = React.useState(false)
  const [selfHover, setSelfHover] = React.useState(false)

  const hoverIn = () => {
    setSelfHover(true)
  }

  const hoverOut = () => {
    setSelfHover(false)
  }

  const iHaveVisibleDescendents = React.useMemo(
    () => hasVisibleDescendent(column, searchTerm),
    [column, searchTerm]
  )

  const effectivelyCollapsed =
    collapsed && (searchTerm === null || !iHaveVisibleDescendents)

  if (!showAll && !iHaveVisibleDescendents) {
    return null
  }

  const handleDropdownClick = () => {
    setCollapsed(!collapsed)
  }

  const hideAll = (column: ColumnInstance<Experiment>) => {
    if (columnIsParent(column)) {
      for (const c of column.columns) {
        hideAll(c)
      }
    } else if (columnMatchesSearch(column, searchTerm)) {
      column.toggleHidden(true)
    }
  }

  if (columnIsParent(column)) {
    return (
      <div>
        <MenuItem
          id={column.id}
          key={`manage-column-${column.id}`}
          hover={ancestorHover || selfHover}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          <div
            className={styles.manageColumns__row_heading}
            onClick={handleDropdownClick}
            onKeyDown={handleDropdownClick}
            role="menu"
            tabIndex={0}
          >
            <span
              key={`column-${column.Header}-span`}
              style={{ width: 20 * column.depth }}
            />
            <DragDots />
            <Chevron open={!effectivelyCollapsed} />
            {column.Header}
          </div>
          <Button small onClick={() => hideAll(column)}>
            Hide all
          </Button>
        </MenuItem>
        {!effectivelyCollapsed &&
          column.columns.map(c => (
            <ColumnRows
              key={c.id}
              searchTerm={searchTerm}
              column={c}
              showAll={showAll || columnMatchesSearch(column, searchTerm)}
              ancestorHover={ancestorHover || selfHover}
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
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          hover={ancestorHover || selfHover}
          className={styles.menuItem_button}
        >
          <div className={styles.manageColumns__row_heading}>
            <span
              key={`column-${column.Header}-span`}
              style={{ width: 20 * column.depth }}
            />
            <DragDots />
            {column.Header}
          </div>
          <input
            type="checkbox"
            id={column.id}
            checked={column.isVisible}
            readOnly
            onClick={() => {
              onToggle?.(column)
            }}
            key={`manage-column-input-${column.id}`}
          />
        </MenuItem>
      </div>
    )
  }
}
