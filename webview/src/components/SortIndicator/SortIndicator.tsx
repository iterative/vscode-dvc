import React from 'react'
import { ColumnInstance } from 'react-table'
import { InstanceProp } from '../Table'
import { isEmpty } from 'lodash'
import {
  SortMenuToggle,
  SortMenu,
  SortMenuItemGroup,
  SortMenuItem,
  SortMenuSeparator
} from './SortMenu'
import { Experiment } from '../../util/parse-experiments'

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
  const { allColumns } = instance
  const [sortIndicatorState, setSortIndicatorState] = React.useState({
    isOpen: false,
    sortColumn: '',
    sortDirection: '',
    hideColumn: false
  })

  const onToggle = (isOpen: any) => {
    setSortIndicatorState({
      ...sortIndicatorState,
      isOpen: isOpen
    })
  }

  const onSelectDirection = (event: any, direction: string) => {
    setSortIndicatorState({
      ...sortIndicatorState,
      sortDirection: direction
    })
  }

  const onSelectColumn = (event: any, column: string) => {
    setSortIndicatorState({
      ...sortIndicatorState,
      sortColumn: column,
      sortDirection: isEmpty(sortIndicatorState.sortColumn)
        ? 'Asc'
        : sortIndicatorState.sortDirection
    })
  }

  const toggle = (
    <SortMenuToggle onToggle={onToggle} toggleTemplate="Sort By" id="toggle" />
  )

  const directionGroup = (
    <SortMenuItemGroup id="sort-direction" key="sort-direction-group">
      <SortMenuItem
        key="sort-direction-asc"
        id="asc"
        onSelect={onSelectDirection}
        isSelected={'Asc' === sortIndicatorState.sortDirection}
      >
        Asc
      </SortMenuItem>
      <SortMenuItem
        key="sort-direction-desc"
        id="desc"
        onSelect={onSelectDirection}
        isSelected={'Desc' === sortIndicatorState.sortDirection}
      >
        Desc
      </SortMenuItem>
    </SortMenuItemGroup>
  )

  const columnGroup = (
    <SortMenuItemGroup id="sort-column" key="sort-column-group">
      {allColumns.map(column => {
        return (
          <SortMenuItem
            id={column.id}
            onSelect={onSelectColumn}
            isSelected={column.Header === sortIndicatorState.sortColumn}
            key={`sort-column-${column.id}`}
          >
            {column.Header}
          </SortMenuItem>
        )
      })}
    </SortMenuItemGroup>
  )

  const menuSeparator = <SortMenuSeparator key="sort-menu-separator" />

  const menuItems = [columnGroup, menuSeparator, directionGroup]

  return (
    <SortMenu
      id="sort-menu"
      menuItems={menuItems}
      isOpen={sortIndicatorState.isOpen}
      toggle={toggle}
    />
  )
}

export default SortIndicator
