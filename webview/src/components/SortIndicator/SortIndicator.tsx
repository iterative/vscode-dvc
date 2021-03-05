import React from 'react'
import { InstanceProp } from '../Table'
import { isEmpty } from 'lodash'
import {
  SortMenuToggle,
  SortMenu,
  SortMenuItemGroup,
  SortMenuItem,
  SortMenuSeparator
} from './SortMenu'
import styles from './SortIndicator.module.scss'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'

const SortIndicator: React.FC<InstanceProp> = ({ instance }) => {
  const { columns: columnInstances } = instance
  const [sortIndicatorState, setSortIndicatorState] = React.useState({
    isOpen: false,
    sortColumn: '',
    sortDirection: ''
  })

  const onToggle = (isOpen: any) => {
    setSortIndicatorState({
      ...sortIndicatorState,
      isOpen: isOpen
    })
  }

  const onSelectColumn = (column: string) => {
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

  const columnOptions = (column: ColumnInstance<Experiment>): any => (
    <>
      {!column.canSort && (
        <>
          <SortMenuSeparator />
          <span
            key={`${column.id}-column-group`}
            className={styles.sortIndicator__columnGroup}
          >
            {'-'.repeat(column.depth)}
            {column.Header}
          </span>
        </>
      )}
      {column.canSort && (
        <SortMenuItem
          id={column.id}
          onSelect={onSelectColumn}
          key={`sort-column-${column.Header}-${column.id}`}
          value={column.Header}
          actions={
            <>
              {column.isSorted && (
                <span
                  key="sort-direction-icon"
                  className={styles.sortIndicator__sortDirectionIcon}
                >
                  {column.isSortedDesc ? (
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
                </span>
              )}
              {(!column.columns || column.columns.length === 0) && (
                <span
                  key="column-visibility"
                  className={styles.sortIndicator__columnVisibility}
                  onClick={() => {
                    column.toggleHidden()
                  }}
                >
                  {column.isVisible ? (
                    <svg
                      fill="currentColor"
                      height="1em"
                      width="1em"
                      viewBox="0 0 512 512"
                      aria-hidden="true"
                      role="img"
                      style={{ verticalAlign: -0.125 + 'em' }}
                    >
                      <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zM124 296c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h264c6.6 0 12 5.4 12 12v56c0 6.6-5.4 12-12 12H124z"></path>
                    </svg>
                  ) : (
                    <svg
                      fill="currentColor"
                      height="1em"
                      width="1em"
                      viewBox="0 0 512 512"
                      aria-hidden="true"
                      role="img"
                      style={{ verticalAlign: -0.125 + 'em' }}
                    >
                      <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"></path>
                    </svg>
                  )}
                </span>
              )}
            </>
          }
          {...column.getSortByToggleProps()}
        >
          <span key={`sort-column-${column.Header}-span`}>
            {'-'.repeat(column.depth)}
          </span>
          {column.Header}
        </SortMenuItem>
      )}
      {column.columns &&
        column.columns.map((childColumn: any) => columnOptions(childColumn))}
    </>
  )

  const menuItems = [
    <SortMenuItemGroup id="sort-column" key="sort-column-group">
      {columnInstances.map(column => {
        return <>{columnOptions(column)}</>
      })}
    </SortMenuItemGroup>
  ]

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
