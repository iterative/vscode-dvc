import React from 'react'
import { ExperimentsRepoJSONOutput } from 'dvc/src/experiments/contract'
import { Column as ColumnData } from 'dvc/src/experiments/webview/contract'
import {
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
import dayjs from '../../dayjs'
import { Table } from '../Table'
import parseExperiments, {
  ExperimentWithSubRows
} from '../../util/parse-experiments'

import styles from '../Table/styles.module.scss'

import buildDynamicColumns from '../../util/build-dynamic-columns'

import { VsCodeApi } from '../../model'

const countRowsAndAddIndexes: (
  rows: Row<ExperimentWithSubRows>[],
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

const isDesc = (direction: boolean | 'desc') =>
  direction === false || direction === 'desc'

const sortByDirection = (desc: boolean, sortInt: number) =>
  desc ? -sortInt : sortInt

const sortByFirstDirection = (
  direction: boolean | 'desc',
  rowA: Row<ExperimentWithSubRows>,
  rowB: Row<ExperimentWithSubRows>
) => (isDesc(direction) ? rowA.index - rowB.index : rowB.index - rowA.index)

const getSortedRows = (
  rows: Row<ExperimentWithSubRows>[],
  sortFns: SortByFn<ExperimentWithSubRows>[],
  directions: (boolean | 'desc')[]
): Row<ExperimentWithSubRows>[] =>
  [...rows].sort((rowA, rowB) => {
    for (let i = 0; i < sortFns.length; i += 1) {
      const sortFn = sortFns[i]
      const desc = isDesc(directions[i])
      const sortInt = sortFn(rowA, rowB, '', desc)
      if (sortInt !== 0) {
        return sortByDirection(desc, sortInt)
      }
    }
    return sortByFirstDirection(directions[0], rowA, rowB)
  })

const orderByFn = (
  rows: Row<ExperimentWithSubRows>[],
  sortFns: SortByFn<ExperimentWithSubRows>[],
  directions: (boolean | 'desc')[],
  parentRow: Row<ExperimentWithSubRows>
): Row<ExperimentWithSubRows>[] => {
  if (parentRow && parentRow.depth === 0) {
    return getSortedRows(rows, sortFns, directions)
  } else {
    return rows
  }
}

const getColumns = (
  params: ColumnData[],
  metrics: ColumnData[]
): Column<ExperimentWithSubRows>[] =>
  [
    {
      Header: 'Experiment',
      accessor: ({ name, id }: { name: string | undefined; id: string }) => {
        if (name) {
          return name
        }
        if (id === 'workspace') {
          return id
        }
        return id.slice(0, 7)
      },
      id: 'id',
      width: 150
    },
    {
      Cell: ({ value }: { value: string }) => {
        if (!value || value === '') {
          return null
        }
        const time = dayjs(value)
        return time.format(time.isToday() ? 'HH:mm:ss' : 'YYYY/MM/DD')
      },
      Header: 'Timestamp',
      accessor: 'timestamp'
    },
    ...buildDynamicColumns(params, metrics)
  ] as Column<ExperimentWithSubRows>[]

export const ExperimentsTable: React.FC<{
  experiments: ExperimentsRepoJSONOutput
  params: ColumnData[]
  metrics: ColumnData[]
}> = ({ experiments: rawExperiments, params, metrics }) => {
  const [initialState, defaultColumn] = React.useMemo(() => {
    const initialState = {}
    const defaultColumn: Partial<Column<ExperimentWithSubRows>> = {
      width: 110
    }
    return [initialState, defaultColumn]
  }, [])

  const [data, columns] = React.useMemo(() => {
    const { experiments } = parseExperiments(rawExperiments)
    const columns = getColumns(params, metrics)
    return [experiments, columns]
  }, [rawExperiments, params, metrics])

  const instance = useTable<ExperimentWithSubRows>(
    {
      autoResetExpanded: false,
      columns,
      data,
      defaultColumn,
      expandSubRows: false,
      initialState,
      orderByFn
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
        const sortedColumns: ColumnInstance<ExperimentWithSubRows>[] =
          allColumns.filter(column => column.isSorted)
        const expandedRowCount = countRowsAndAddIndexes(rows)
        Object.assign(instance, {
          expandedRowCount,
          sortedColumns
        })
      })
    }
  )

  const { toggleAllRowsExpanded } = instance

  React.useEffect(() => {
    toggleAllRowsExpanded()
  }, [toggleAllRowsExpanded])

  return (
    <>
      <Table instance={instance} />
    </>
  )
}

const Experiments: React.FC<{
  experiments?: ExperimentsRepoJSONOutput | null
  params: ColumnData[]
  metrics: ColumnData[]
  vsCodeApi: VsCodeApi
}> = ({ experiments, params, metrics }) => {
  return (
    <div className={styles.experiments}>
      {experiments ? (
        <ExperimentsTable
          experiments={experiments}
          params={params}
          metrics={metrics}
        />
      ) : (
        <p>Loading experiments...</p>
      )}
    </div>
  )
}

export default Experiments
