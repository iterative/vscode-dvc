import { ColumnInstance } from 'react-table'
import React from 'react'
import menuStyles from './SortMenu.scss'
import { Experiment } from '../Experiments'
import { InstanceProp } from '../Table'
import { isEmpty } from 'lodash'

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
  const sortMenuRef = React.useRef(null)
  const [isClickedOutside, setClickedOutside] = React.useState(false)
  const [sortIndicatorState, setSortIndicatorState] = React.useState({
    isOpen: false,
    sortColumn: '',
    sortDirection: '',
    hideColumn: false
  })

  React.useEffect(() => {
    if (isClickedOutside) {
      setSortIndicatorState({
        ...sortIndicatorState,
        isOpen: false
      })
    }
  }, [isClickedOutside])

  // hook for handling a click that happens outside the SortIndicator component
  React.useEffect(() => {
    const outsideClickEventHandler = (e: any) => {
      const target: any = sortMenuRef.current
      if (target !== null && !target.contains(e.target)) {
        setClickedOutside(true)
      } else {
        setClickedOutside(false)
      }
    }

    if (sortIndicatorState.isOpen) {
      document.addEventListener('click', outsideClickEventHandler)
    }

    return () => {
      document.removeEventListener('click', outsideClickEventHandler)
    }
  }, [sortIndicatorState.isOpen])

  return (
    <div className={menuStyles.sortMenu}>
      <button
        onClick={() => {
          setSortIndicatorState({
            ...sortIndicatorState,
            isOpen: !sortIndicatorState.isOpen //Toggle
          })
        }}
        className={menuStyles.sortMenu__toggle}
      >
        <span className={menuStyles.sortMenu__toggle__text}>Sort By</span>
        <span className={menuStyles.sortMenu__toggle__icon}>
          <svg
            fill="currentColor"
            height="1em"
            width="1em"
            viewBox="0 0 320 512"
            aria-hidden="true"
            role="img"
            style={{ verticalAlign: -0.125 + 'em' }}
          >
            <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"></path>
          </svg>
        </span>
      </button>
      {sortIndicatorState.isOpen ? (
        <div
          ref={sortMenuRef}
          className={menuStyles.sortMenu__menu}
          role="menu"
        >
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
                          sortColumn: column.Header as string,
                          sortDirection: isEmpty(sortIndicatorState.sortColumn)
                            ? 'Asc'
                            : sortIndicatorState.sortDirection
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
