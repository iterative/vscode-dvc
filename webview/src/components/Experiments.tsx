import * as React from 'react'
import {
  ExperimentsRepoJSONOutput,
  ExperimentJSONOutput
} from 'dvc/src/DvcReader' // these need to come through the contract
import {
  TableInstance,
  Row,
  Column,
  ColumnInstance,
  useTable,
  useGroupBy,
  useExpanded,
  useSortBy,
  useFlexLayout,
  SortByFn
} from 'react-table'
import cx from 'classnames'
import dayjs from '../dayjs'
import { Table } from './Table'
import parseExperiments from '../util/parse-experiments'

import styles from './table-styles.module.scss'

import buildDynamicColumns from './build-dynamic-columns'
import { MessageFromWebviewKind } from 'dvc/src/webviewContract'

const { useMemo, useEffect } = React

export interface Experiment extends ExperimentJSONOutput {
  subRows?: Experiment[]
  id: string
}

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface RowProp {
  row: Row<Experiment>
}

const countRowsAndAddIndexes: (
  rows: Row<Experiment>[],
  index?: number
) => number = (rows, index = 0) => {
  for (const row of rows) {
    row.flatIndex = index
    index += 1
    if (row.isExpanded) {
      index = countRowsAndAddIndexes(row.subRows, index)
    }
  }
  return index
}

const orderByFn: (
  rows: Row<Experiment>[],
  sortFns: SortByFn<Experiment>[],
  directions: (boolean | 'desc')[],
  parentRow: Row<Experiment>
) => Row<Experiment>[] = (arr, funcs, dirs, parentRow) => {
  if (parentRow && parentRow.depth === 0) {
    return [...arr].sort((rowA, rowB) => {
      for (let i = 0; i < funcs.length; i += 1) {
        const sortFn = funcs[i]
        const desc = dirs[i] === false || dirs[i] === 'desc'
        const sortInt = sortFn(rowA, rowB, '', desc)
        if (sortInt !== 0) {
          return desc ? -sortInt : sortInt
        }
      }
      return dirs[0] ? rowA.index - rowB.index : rowB.index - rowA.index
    })
  } else {
    return arr
  }
}

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

const OptionsPanel: React.FC<InstanceProp> = ({ instance }) => {
  const { columns: columnInstances, sortedColumns } = instance

  return (
    <details className={styles.optionsPanel}>
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
    </details>
  )
}

export const ExperimentsTable: React.FC<{
  experiments: ExperimentsRepoJSONOutput
}> = ({ experiments: rawExperiments }) => {
  const [initialState, defaultColumn] = useMemo(() => {
    const initialState = {}
    const defaultColumn: Partial<Column<Experiment>> = {}
    return [initialState, defaultColumn]
  }, [])

  const [data, columns] = useMemo(() => {
    const { experiments, flatExperiments } = parseExperiments(rawExperiments)
    const columns = [
      {
        Header: 'Experiment',
        id: 'id',
        accessor: ({ name, id }) => {
          if (name) return name
          if (id === 'workspace') return id
          return id.slice(0, 7)
        },
        width: 200
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
    ] as Column<Experiment>[]
    return [experiments, columns]
  }, [rawExperiments])

  const instance = useTable<Experiment>(
    {
      columns,
      data,
      initialState,
      defaultColumn,
      orderByFn,
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
    },
    useGroupBy,
    useSortBy,
    useExpanded,
    hooks => {
      hooks.useInstance.push(instance => {
        const { allColumns, rows } = instance
        const sortedColumns: ColumnInstance<Experiment>[] = useMemo(
          () => allColumns.filter(column => column.isSorted),
          [allColumns]
        )
        const expandedRowCount = countRowsAndAddIndexes(rows)
        Object.assign(instance, {
          sortedColumns,
          expandedRowCount
        })
      })
    }
  )

  const { toggleAllRowsExpanded } = instance

  useEffect(() => {
    toggleAllRowsExpanded()
  }, [])

  return (
    <>
      <OptionsPanel instance={instance} />
      <Table instance={instance} />
    </>
  )
}

const Experiments: React.FC<{
  experiments?: ExperimentsRepoJSONOutput | null
  vsCodeApi: any
}> = ({ experiments, vsCodeApi }) => {
  return (
    <div className={styles.experiments}>
      <h1 className={cx(styles.experimentsHeading, styles.pageHeading)} />
      <button
        onClick={() => {
          vsCodeApi.postMessage({
            kind: MessageFromWebviewKind.onClickRunExperiment
          })
        }}
      >
        Run Experiment
      </button>
      {experiments ? (
        <ExperimentsTable experiments={experiments} />
      ) : (
        <p>Loading experiments...</p>
      )}
    </div>
  )
}

export default Experiments
