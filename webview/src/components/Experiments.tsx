import * as React from 'react'
import {
  DVCExperimentsRepoJSONOutput,
  DVCExperiment,
  DVCExperimentWithSha
} from 'dvc-integration/src/DvcReader'
import {
  TableInstance,
  Row,
  Column,
  ColumnInstance,
  useTable,
  useGroupBy,
  useExpanded,
  useSortBy,
  useFlexLayout
} from 'react-table'
import cx from 'classnames'
import dayjs from '../dayjs'
import { TableBody, TableHead } from './Table'

import buildDynamicColumns from './build-dynamic-columns'

import { nestAndFlattenSubRows } from '../util/build-experiment-tree'

const { useCallback, useMemo, useEffect } = React

export interface DVCExperimentRow extends DVCExperimentWithSha {
  subRows?: DVCExperimentRow[]
}

export interface InstanceProp {
  instance: TableInstance<DVCExperimentRow>
}

export interface RowProp {
  row: Row<DVCExperimentRow>
}

interface ParseExperimentsOutput {
  experiments: DVCExperimentRow[]
  flatExperiments: DVCExperimentRow[]
}

const parseExperimentJSONEntry: (
  sha: string,
  experiment: DVCExperiment
) => DVCExperimentWithSha = (sha, experiment) => ({
  ...experiment,
  sha
})

const ColumnOptionsRow: React.FC<{
  column: ColumnInstance<DVCExperimentRow>
}> = ({ column }) => {
  return (
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
}

const parseExperiments: (
  experimentsData: DVCExperimentsRepoJSONOutput
) => ParseExperimentsOutput = experimentsData => {
  return Object.entries(experimentsData).reduce<ParseExperimentsOutput>(
    (
      { experiments, flatExperiments },
      [commitId, { baseline, ...childExperiments }]
    ) => {
      const parsedChildExperiments = Object.entries(
        childExperiments
      ).map(([sha, experiment]) => parseExperimentJSONEntry(sha, experiment))
      const baselineEntry = parseExperimentJSONEntry(commitId, baseline)
      return {
        experiments: [
          ...experiments,
          {
            ...baselineEntry,
            subRows: parsedChildExperiments
          }
        ],
        flatExperiments: [
          ...flatExperiments,
          baselineEntry,
          ...parsedChildExperiments
        ]
      }
    },
    {
      experiments: [],
      flatExperiments: []
    }
  )
}

const TruncatedCell = ({ value }: { value: string }) =>
  value && value.length && value.length > 12
    ? `${value.slice(0, 4)}...${value.slice(value.length - 4)}`
    : value

function ungroupByCommit(instance: TableInstance<DVCExperimentRow>) {
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
  const ungroupedRows = useMemo(
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
  if (!ungrouped) return
  Object.assign(instance, {
    rows: ungroupedRows
  })
}

const OptionsPanel: React.FC<InstanceProp> = ({ instance }) => {
  const {
    columns: columnInstances,
    toggleCommitUngroup,
    state,
    sortedColumns
  } = instance

  return (
    <details className="options-panel">
      <summary>
        <b>Options</b>
        <div>Sorted by:</div>
        <div>
          {sortedColumns.map(column => (
            <span key={column.id}>
              {column.render('Header')} ({column.isSortedDesc ? 'DESC' : 'ASC'})
            </span>
          ))}
        </div>
      </summary>
      {columnInstances.map(column => (
        <ColumnOptionsRow column={column} key={column.id} />
      ))}
      <button onClick={() => toggleCommitUngroup()}>
        {state.ungrouped ? 'Group' : 'Ungroup'} by Commit
      </button>
    </details>
  )
}

export const ExperimentsTable: React.FC<{
  experiments: DVCExperimentsRepoJSONOutput
}> = ({ experiments: rawExperiments }) => {
  const [initialState, defaultColumn] = useMemo(() => {
    const initialState = {}
    const defaultColumn: Partial<Column<DVCExperimentRow>> = {}
    return [initialState, defaultColumn]
  }, [])

  const [data, columns] = useMemo(() => {
    const { experiments, flatExperiments } = parseExperiments(rawExperiments)
    const columns = [
      {
        Header: 'Experiment',
        id: 'sha',
        accessor: (item: any) => item.name || item.sha,
        Cell: TruncatedCell,
        disableGroupBy: true,
        width: 175
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
      ...buildDynamicColumns(flatExperiments)
    ] as Column<DVCExperimentRow>[]
    const nestedExperiments = experiments.reduce<DVCExperimentRow[]>(
      (acc, cur) => [...acc, ...nestAndFlattenSubRows(cur)],
      []
    )
    return [nestedExperiments, columns]
  }, [rawExperiments])

  const instance = useTable<DVCExperimentRow>(
    {
      columns,
      data,
      initialState,
      defaultColumn,
      expandSubRows: false
    },
    useFlexLayout,
    hooks => {
      hooks.stateReducers.push((state, action) => {
        if (action.type === 'set-ungrouped') {
          return {
            ...state,
            ungrouped: action.setting || !state.ungrouped
          }
        }
        return state
      })
      hooks.useInstance.push(ungroupByCommit)
    },
    useGroupBy,
    useSortBy,
    useExpanded,
    hooks => {
      hooks.useInstance.push(instance => {
        const { allColumns } = instance
        const sortedColumns: ColumnInstance<DVCExperimentRow>[] = useMemo(
          () => allColumns.filter(column => column.isSorted),
          [allColumns]
        )
        Object.assign(instance, {
          sortedColumns
        })
      })
    }
  )

  const { getTableProps, toggleAllRowsExpanded, rows } = instance

  useEffect(() => {
    toggleAllRowsExpanded()
  }, [])

  return (
    <>
      <OptionsPanel instance={instance} />
      <div className="table-container">
        <div {...getTableProps({ className: 'table' })}>
          <TableHead instance={instance} />
          {rows.map(row => {
            return <TableBody row={row} instance={instance} key={row.id} />
          })}
        </div>
      </div>
    </>
  )
}

const Experiments: React.FC<{
  experiments?: DVCExperimentsRepoJSONOutput | null
}> = ({ experiments }) => (
  <div className="experiments">
    <h1 className={cx('experiments-heading', 'page-heading')}>Experiments</h1>
    {experiments ? (
      <ExperimentsTable experiments={experiments} />
    ) : (
      <p>Loading experiments...</p>
    )}
  </div>
)

export default Experiments
