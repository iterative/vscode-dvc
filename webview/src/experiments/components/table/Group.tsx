import React from 'react'
import cx from 'classnames'
import { RowProp, ExperimentRow } from './Row'
import { InstanceProp } from './Table'
import styles from './styles.module.scss'

const NestedRow: React.FC<RowProp & InstanceProp> = ({ row, instance }) => {
  instance.prepareRow(row)
  return <ExperimentRow row={row} className={styles.nestedRow} />
}

export const ExperimentGroup: React.FC<RowProp & InstanceProp> = ({
  row,
  instance
}) => {
  instance.prepareRow(row)
  return (
    <div
      className={cx(
        styles.experimentGroup,
        row.isExpanded && row.subRows.length > 0 && styles.expandedGroup
      )}
    >
      <NestedRow row={row} instance={instance} />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow row={row} instance={instance} key={row.id} />
        ))}
    </div>
  )
}
