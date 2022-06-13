import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { RowContent } from './Row'
import { InstanceProp, RowProp, TableProps, WithChanges } from './interfaces'

export const NestedRow: React.FC<RowProp & InstanceProp> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints
}) => {
  instance.prepareRow(row)
  return (
    <RowContent
      row={row}
      className={styles.nestedRow}
      contextMenuDisabled={contextMenuDisabled}
      projectHasCheckpoints={projectHasCheckpoints}
    />
  )
}

export const ExperimentGroup: React.FC<RowProp & InstanceProp> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints
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
        projectHasCheckpoints={projectHasCheckpoints}
      />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow
            row={row}
            instance={instance}
            key={row.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
          />
        ))}
    </div>
  )
}

export const TableBody: React.FC<RowProp & InstanceProp & WithChanges> = ({
  row,
  instance,
  changes,
  contextMenuDisabled,
  projectHasCheckpoints
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
        projectHasCheckpoints={projectHasCheckpoints}
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
            projectHasCheckpoints={projectHasCheckpoints}
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
  const {
    filters,
    sorts,
    columns,
    changes,
    hasCheckpoints,
    hasRunningExperiment
  } = tableData

  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead
          instance={instance}
          sorts={sorts}
          filters={filters}
          columns={columns}
        />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            changes={changes}
            contextMenuDisabled={hasRunningExperiment}
            projectHasCheckpoints={hasCheckpoints}
          />
        ))}
      </div>
    </div>
  )
}
