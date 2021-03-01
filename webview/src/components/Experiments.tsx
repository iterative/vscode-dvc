import * as React from 'react'
import {
  ExperimentsRepoJSONOutput,
  MessageFromWebviewType,
  ExperimentJSONOutput
} from 'dvc/src/webviews/experiments/contract'
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
import dayjs from '../dayjs'
import { Table } from './Table'
import parseExperiments, { Experiment } from '../util/parse-experiments'

import styles from './table-styles.module.scss'

import buildDynamicColumns from '../util/build-dynamic-columns'

import { VsCodeApi } from '../model/Model'
import SortIndicator from './SortIndicator/SortIndicator'

export interface Experiment extends ExperimentJSONOutput {
  subRows?: Experiment[]
  id: string
}

const { useMemo, useEffect } = React

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
      expandSubRows: false,
      autoResetExpanded: false
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
        const sortedColumns: ColumnInstance<Experiment>[] = allColumns.filter(
          column => column.isSorted
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
  }, [toggleAllRowsExpanded])

  return (
    <>
      <SortIndicator instance={instance} />
      <Table instance={instance} />
    </>
  )
}

const Experiments: React.FC<{
  experiments?: ExperimentsRepoJSONOutput | null
  vsCodeApi: VsCodeApi
}> = ({ experiments, vsCodeApi }) => {
  return (
    <div className={styles.experiments}>
      <button
        onClick={() => {
          vsCodeApi.postMessage({
            type: MessageFromWebviewType.onClickRunExperiment
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
