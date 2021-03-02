import { ColumnInstance } from 'react-table'
import React from 'react'
import menuStyles from './SortMenu.scss'
import { Experiment } from '../Experiments'
import { InstanceProp } from '../Table'

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

const SelectedItem = (
  <span className={menuStyles.sortMenu__menuItem__icon}>
    <svg
      fill="currentColor"
      height="1em"
      width="1em"
      viewBox="0 0 512 512"
      aria-hidden="true"
      role="img"
      style={{ verticalAlign: -0.125 + 'em' }}
    >
      <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>
)

const SortIndicator: React.FC<InstanceProp> = ({ instance }) => {
  const { allColumns } = instance
  const [sortIndicatorState, setSortIndicatorState] = React.useState({
    isOpen: false,
    sortColumn: '',
    sortDirection: '',
    hideColumn: false
  })

  return (
    <div className={menuStyles.sortMenu}>
      <div className={menuStyles.sortMenu__toggle}>
        <button
          onClick={() => {
            setSortIndicatorState({
              ...sortIndicatorState,
              isOpen: !sortIndicatorState.isOpen //Toggle
            })
          }}
          className={menuStyles.sortMenu__toggle__button}
        >
          Sort By
        </button>
      </div>
      {sortIndicatorState.isOpen ? (
        <div className={menuStyles.sortMenu__menu} role="menu">
          <section className={menuStyles.sortMenu__group}>
            <ul>
              {allColumns.map(column => {
                return (
                  <li id={column.id} key={column.id} role="menuitem">
                    <button
                      key={`button-${column.id}`}
                      className={menuStyles.sortMenu__menuItem}
                      onClick={() => {
                        setSortIndicatorState({
                          ...sortIndicatorState,
                          sortColumn: column.Header as string
                        })
                      }}
                    >
                      {column.Header}
                      {sortIndicatorState.sortColumn === column.Header
                        ? SelectedItem
                        : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          <li role="separator"></li>
          <section className={menuStyles.sortMenu__group}>
            <ul>
              <li role="menuitem">
                <button
                  className={menuStyles.sortMenu__menuItem}
                  onClick={() => {
                    setSortIndicatorState({
                      ...sortIndicatorState,
                      sortDirection: 'Asc'
                    })
                  }}
                >
                  Asc
                  {sortIndicatorState.sortDirection === 'Asc'
                    ? SelectedItem
                    : null}
                </button>
              </li>
              <li role="menuitem">
                <button
                  className={menuStyles.sortMenu__menuItem}
                  onClick={() => {
                    setSortIndicatorState({
                      ...sortIndicatorState,
                      sortDirection: 'Desc'
                    })
                  }}
                >
                  Desc
                  {sortIndicatorState.sortDirection === 'Desc'
                    ? SelectedItem
                    : null}
                </button>
              </li>
            </ul>
          </section>
          <li role="separator"></li>
          <section className={menuStyles.sortMenu__group}>
            <ul>
              <li role="menuitem">
                <button
                  className={menuStyles.sortMenu__menuItem}
                  onClick={() => {
                    setSortIndicatorState({
                      ...sortIndicatorState,
                      hideColumn: true
                    })
                  }}
                >
                  Hide
                  {sortIndicatorState.hideColumn ? SelectedItem : null}
                </button>
              </li>
              <li role="menuitem">
                <button
                  className={menuStyles.sortMenu__menuItem}
                  onClick={() => {
                    setSortIndicatorState({
                      ...sortIndicatorState,
                      hideColumn: false
                    })
                  }}
                >
                  Show
                  {sortIndicatorState.sortColumn &&
                  !sortIndicatorState.hideColumn
                    ? SelectedItem
                    : null}
                </button>
              </li>
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default SortIndicator
