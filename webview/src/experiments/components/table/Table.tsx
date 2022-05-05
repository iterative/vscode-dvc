import React from 'react'
import cx from 'classnames'
import { Row } from 'dvc/src/experiments/webview/contract'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { RowContent } from './Row'
import { InstanceProp, RowProp, TableProps, WithChanges } from './interfaces'

export const NestedRow: React.FC<RowProp & InstanceProp> = ({
  row,
  instance,
  contextMenuDisabled
}) => {
  instance.prepareRow(row)
  return (
    <RowContent
      row={row}
      className={styles.nestedRow}
      contextMenuDisabled={contextMenuDisabled}
    />
  )
}

export const ExperimentGroup: React.FC<RowProp & InstanceProp> = ({
  row,
  instance,
  contextMenuDisabled
}) => {
  instance.prepareRow(row)
  return (
    <div
      className={cx(
        styles.experimentGroup,
        row.isExpanded && row.subRows.length > 0 && styles.expandedGroup
      )}
    >
      <NestedRow
        row={row}
        instance={instance}
        contextMenuDisabled={contextMenuDisabled}
      />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow
            row={row}
            instance={instance}
            key={row.id}
            contextMenuDisabled={contextMenuDisabled}
          />
        ))}
    </div>
  )
}

export const TableBody: React.FC<RowProp & InstanceProp & WithChanges> = ({
  row,
  instance,
  changes,
  contextMenuDisabled
}) => {
  instance.prepareRow(row)
  return (
    <div
      {...instance.getTableBodyProps({
        className: cx(
          styles.rowGroup,
          styles.tbody,
          row.values.id === 'workspace'
            ? styles.workspaceRowGroup
            : styles.normalRowGroup
        )
      })}
    >
      <RowContent
        row={row}
        changes={changes}
        contextMenuDisabled={contextMenuDisabled}
      />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <ExperimentGroup
            row={subRow}
            instance={instance}
            key={subRow.values.id}
            contextMenuDisabled={contextMenuDisabled}
          />
        ))}
    </div>
  )
}

export const Table: React.FC<TableProps & WithChanges> = ({
  instance,
  tableData
}) => {
  const { getTableProps, rows } = instance
  const { sorts, columns, changes, rows: experimentRows } = tableData

  const someExperimentsRunning = React.useMemo(() => {
    const findRunningExperiment: (experiments?: Row[]) => boolean = (
      experiments?: Row[]
    ) => {
      return !!experiments?.find(
        experiment =>
          experiment.running || findRunningExperiment(experiment.subRows)
      )
    }

    return findRunningExperiment(experimentRows)
  }, [experimentRows])

  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead instance={instance} sorts={sorts} columns={columns} />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            changes={changes}
            contextMenuDisabled={someExperimentsRunning}
          />
        ))}
      </div>
    </div>
  )
}
