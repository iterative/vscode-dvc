import * as React from 'react'
import {
  DataFileDict,
  DVCExperimentsRepoJSONOutput,
  DVCExperimentJSONOutput,
  DVCExperimentWithSha
} from 'dvc-integration/src/DvcReader'
import {
  Row,
  Column,
  ColumnInstance,
  useTable,
  useGroupBy,
  useExpanded,
  useSortBy,
  useFlexLayout,
  HeaderGroup
} from 'react-table'
import cx from 'classnames'
import dayjs from '../dayjs'

const { useCallback, useMemo } = React

interface DVCExperimentRow extends DVCExperimentWithSha {
  subRows?: DVCExperimentRow[]
}

const parseExperimentJSONEntry: (
  sha: string,
  experiment: DVCExperimentJSONOutput
) => DVCExperimentWithSha = (sha, { checkpoint_tip, ...rest }) => ({
  ...rest,
  checkpointTip: checkpoint_tip,
  sha
})

const ColumnOptionsRow: React.FC<{
  column: ColumnInstance<DVCExperimentRow>
}> = ({ column }) => {
  return (
    <div>
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
      </div>
      {column.columns &&
        column.columns.map(childColumn => (
          <ColumnOptionsRow column={childColumn} key={childColumn.id} />
        ))}
    </div>
  )
}

const parseExperiments = (experimentsData: DVCExperimentsRepoJSONOutput) => {
  return Object.entries(experimentsData).reduce<DVCExperimentRow[]>(
    (acc, [commitId, { baseline, ...childExperiments }]) => {
      return [
        ...acc,
        {
          ...parseExperimentJSONEntry(commitId, baseline),
          subRows: Object.entries(childExperiments).map(([sha, experiment]) =>
            parseExperimentJSONEntry(sha, experiment)
          )
        }
      ]
    },
    []
  )
}

interface ObjectEntriesWithParents {
  skippedKeys: string[]
  entries: [string, any][]
}

export const getBranchingEntries: (
  input: Record<string, any>,
  skippedKeys?: string[]
) => ObjectEntriesWithParents = (input, skippedKeys = []) => {
  const entries = Object.entries(input)
  if (entries.length === 1) {
    const [key, value] = entries[0]
    const newPath = [...skippedKeys, key]
    if (typeof value === 'object') {
      return getBranchingEntries(value, newPath)
    }
  }
  return {
    skippedKeys,
    entries
  }
}

const arrayAccessor: <T = string>(
  pathArray: string[]
) => (originalRow: any) => T = pathArray => originalRow =>
  pathArray.reduce((acc, cur) => acc[cur], originalRow)

const buildColumnsFromSampleObject: (
  data: Record<string, any>,
  parents?: string[]
) => Column<DVCExperimentRow>[] = (data, oldParents = []) => {
  const entries = Object.entries(data)
  return entries.map(([fieldName, value]) => {
    const currentPath = [...oldParents, fieldName]
    const base: Column<any> & {
      columns?: Column<any>[]
    } = {
      Header: fieldName,
      id: currentPath.join('___'),
      accessor: arrayAccessor(currentPath)
    }
    if (typeof value === 'object') {
      return {
        ...base,
        disableSortBy: true,
        columns: buildColumnsFromSampleObject(value, currentPath)
      }
    }
    return base
  })
}

const buildNestedColumnsFromExperiments: (def: {
  data: DVCExperimentRow[]
  accessor: keyof DVCExperimentRow
}) => Column<DVCExperimentRow>[] = ({ accessor, data }) => {
  if (!data || data.length === 0) {
    return []
  }
  return buildColumnsFromSampleObject(data[0][accessor] as DataFileDict, [
    accessor
  ])
}

const TruncatedCell = ({ value }: { value: string }) =>
  value && value.length && value.length > 12
    ? `${value.slice(0, 4)}...${value.slice(value.length - 4)}`
    : value

const Blank = <i>Blank</i>

const ParentHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<DVCExperimentRow>
}> = ({ headerGroup }) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx('parent-headers-row', 'tr')
      })}
    >
      {headerGroup.headers.map(column => (
        <span
          {...column.getHeaderProps({
            className: cx(
              'th',
              column.placeholderOf
                ? 'placeholder-header-cell'
                : 'parent-header-cell',
              {
                'grouped-header': column.isGrouped
              }
            )
          })}
        >
          <div>{column.render('Header')}</div>
        </span>
      ))}
    </div>
  )
}

const PrimaryHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<DVCExperimentRow>
}> = ({ headerGroup }) => (
  <div
    className="tr"
    {...headerGroup.getHeaderGroupProps({
      className: 'headers-row'
    })}
  >
    {headerGroup.headers.map(header => (
      <span
        {...header.getHeaderProps(
          header.getSortByToggleProps({
            className: cx('th', {
              'grouped-header': header.isGrouped,
              'sorted-header': header.isSorted
            })
          })
        )}
      >
        <div>
          {header.render('Header')}
          {header.isSorted && <span>{header.isSortedDesc ? '↓' : '↑'}</span>}
        </div>
      </span>
    ))}
  </div>
)

export const ExperimentsTable: React.FC<{
  experiments: DVCExperimentsRepoJSONOutput
}> = ({ experiments }) => {
  const [initialState, defaultColumn] = useMemo(() => {
    const initialState = {}
    const defaultColumn: Partial<Column<DVCExperimentRow>> = {
      Cell: ({ value }: { value?: string | number }) => {
        return value === ''
          ? Blank
          : typeof value === 'number'
          ? value.toLocaleString(undefined, {
              maximumFractionDigits: 2
            })
          : value
      }
    }
    return [initialState, defaultColumn]
  }, [])

  const [data, columns] = useMemo(() => {
    const data = parseExperiments(experiments)
    const columns = [
      {
        Header: 'Experiment',
        accessor: (item: any) => item.name || item.sha,
        Cell: TruncatedCell,
        disableGroupBy: true,
        width: 150
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        Cell: ({ value }: { value: string }) => {
          if (!value || value === '') return null
          const time = dayjs(value)
          return time.format(time.isToday() ? 'HH:mm:ss' : 'YYYY/MM/DD')
        }
      },
      ...buildNestedColumnsFromExperiments({
        accessor: 'params',
        data
      }),
      ...buildNestedColumnsFromExperiments({
        accessor: 'metrics',
        data
      }),
      {
        Header: 'Queued',
        accessor: 'queued'
      }
    ] as Column<DVCExperimentRow>[]
    return [data, columns]
  }, [experiments])

  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    toggleAllRowsExpanded,
    columns: columnInstances,
    toggleCommitUngroup,
    headerGroups,
    state,
    rows,
    sortedColumns
  } = useTable<DVCExperimentRow>(
    {
      columns,
      data,
      initialState,
      isMultiSortEvent: () => true,
      defaultColumn
    },
    hooks => {
      hooks.stateReducers.push((state, action) => {
        if (action.type === 'set-ungrouped') {
          return {
            ...state,
            ungrouped: action.setting || !state.ungrouped
          }
        }
      })
      hooks.useInstance.push(function ungroupByCommit(instance) {
        const {
          rows,
          dispatch,
          state: { ungrouped }
        } = instance
        const toggleCommitUngroup = useCallback(
          setting =>
            dispatch({
              type: 'set-ungrouped',
              setting
            }),
          [dispatch]
        )
        Object.assign(instance, {
          preSortedRows: rows,
          toggleCommitUngroup
        })
        if (!ungrouped) return
        const ungroupedRows = React.useMemo(
          () =>
            rows.reduce<Row<DVCExperimentRow>[]>((acc, row) => {
              if (row.subRows) {
                const result = [
                  ...acc,
                  { ...row, subRows: [] },
                  ...row.subRows
                ].map((item, index) => ({ ...item, index }))
                return result
              }
              return [...acc, row]
            }, []),
          [rows]
        )
        Object.assign(instance, {
          rows: ungroupedRows
        })
      })
    },
    useGroupBy,
    useSortBy,
    useExpanded,
    useFlexLayout,
    hooks => {
      hooks.useInstance.push(instance => {
        const { allColumns } = instance
        const sortedColumns: ColumnInstance<
          DVCExperimentRow
        >[] = allColumns.filter(column => column.isSorted)
        Object.assign(instance, {
          sortedColumns
        })
      })
    }
  )

  React.useEffect(() => {
    toggleAllRowsExpanded(true)
  }, [])

  const lastHeaderGroupIndex = headerGroups.length - 1
  const lastHeaderGroup = headerGroups[lastHeaderGroupIndex]

  return (
    <div>
      <details className="options-panel">
        <summary>
          <b>Options</b>
          <div>Sorted by:</div>
          <div>
            {sortedColumns.map(column => (
              <span>
                {column.render('Header')} (
                {column.isSortedDesc ? 'DESC' : 'ASC'})
              </span>
            ))}
          </div>
        </summary>
        {columnInstances.map(column => (
          <ColumnOptionsRow column={column} />
        ))}
        <button onClick={() => toggleCommitUngroup()}>
          {state.ungrouped ? 'Group' : 'Ungroup'} by Commit
        </button>
      </details>
      <div className="table" {...getTableProps()}>
        <div className="thead">
          {headerGroups.slice(0, lastHeaderGroupIndex).map(headerGroup => (
            <ParentHeaderGroup headerGroup={headerGroup} />
          ))}
          <PrimaryHeaderGroup headerGroup={lastHeaderGroup} />
        </div>
        <div className="tbody" {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row)
            const [firstCell, ...cells] = row.cells
            const baseFirstCellProps = firstCell.getCellProps({
              className: cx('td', 'experiment-cell', {
                'group-placeholder': firstCell.isPlaceholder,
                'grouped-column-cell': firstCell.column.isGrouped,
                'grouped-cell': firstCell.isGrouped
              })
            })
            const firstCellProps = firstCell.row.canExpand
              ? firstCell.row.getToggleRowExpandedProps(baseFirstCellProps)
              : baseFirstCellProps
            return (
              <div
                {...row.getRowProps({
                  className: cx(
                    'tr',
                    row.original.sha === 'workspace'
                      ? 'workspace-row'
                      : 'normal-row'
                  )
                })}
              >
                <div {...firstCellProps}>
                  {firstCell.row.depth > 0 && (
                    <>{'-'.repeat(firstCell.row.depth)} </>
                  )}
                  {firstCell.row.canExpand && (
                    <span>{firstCell.row.isExpanded ? '▼' : '▶'} </span>
                  )}
                  {firstCell.isGrouped ? (
                    <>
                      <span {...row.getToggleRowExpandedProps()}>
                        {row.isExpanded ? '👇' : '👉'}{' '}
                        {firstCell.render('Cell')} ({row.subRows.length})
                      </span>
                    </>
                  ) : firstCell.isAggregated ? (
                    firstCell.render('Aggregated')
                  ) : firstCell.isPlaceholder ? null : (
                    firstCell.render('Cell')
                  )}
                </div>
                {cells.map(cell => {
                  return (
                    <div
                      className="td"
                      {...cell.getCellProps({
                        className: cx({
                          'group-placeholder': cell.isPlaceholder,
                          'grouped-column-cell': cell.column.isGrouped,
                          'grouped-cell': cell.isGrouped
                        })
                      })}
                    >
                      {cell.isGrouped ? (
                        <>
                          <span {...row.getToggleRowExpandedProps()}>
                            {row.isExpanded ? '👇' : '👉'} {cell.render('Cell')}{' '}
                            ({row.subRows.length})
                          </span>
                        </>
                      ) : cell.isAggregated ? (
                        cell.render('Aggregated')
                      ) : cell.isPlaceholder ? null : (
                        cell.render('Cell')
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const Experiments: React.FC<{
  experiments?: DVCExperimentsRepoJSONOutput | null
}> = ({ experiments }) => (
  <div className="experiments">
    <h1>Experiments</h1>
    {experiments ? (
      <ExperimentsTable experiments={experiments} />
    ) : (
      <p>Loading experiments...</p>
    )}
  </div>
)

export default Experiments
