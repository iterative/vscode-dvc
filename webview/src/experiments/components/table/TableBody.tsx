import React, { CSSProperties } from 'react'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
import styles from './styles.module.scss'
import { BatchSelectionProp, RowContent } from './Row'
import { InstanceProp, RowProp } from './interfaces'
import { ExperimentGroup } from './ExperimentGroup'

const WorkspaceRowGroupWrapper: React.FC<
  {
    children: React.ReactNode
    root: HTMLElement | null
    tableHeaderHeight: number
  } & InstanceProp
> = ({ children, instance, root, tableHeaderHeight }) => {
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: `-${tableHeaderHeight + 15}px 0px 0px 0px`,
    threshold: 1
  })

  return (
    <div
      style={
        { '--table-head-height': `${tableHeaderHeight}px` } as CSSProperties
      }
      ref={ref}
      {...instance.getTableBodyProps({
        className: cx(
          styles.rowGroup,
          styles.tbody,
          styles.workspaceRowGroup,
          needsShadow && styles.withShadow
        )
      })}
    >
      {children}
    </div>
  )
}
export const TableBody: React.FC<
  RowProp &
    InstanceProp &
    BatchSelectionProp & { root: HTMLElement | null; tableHeaderHeight: number }
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root,
  tableHeaderHeight
}) => {
  instance.prepareRow(row)

  const content = (
    <>
      <RowContent
        row={row}
        projectHasCheckpoints={projectHasCheckpoints}
        hasRunningExperiment={hasRunningExperiment}
        contextMenuDisabled={contextMenuDisabled}
        batchRowSelection={batchRowSelection}
      />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <ExperimentGroup
            row={subRow}
            instance={instance}
            key={subRow.values.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
            hasRunningExperiment={hasRunningExperiment}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </>
  )
  return row.values.id === 'workspace' ? (
    <WorkspaceRowGroupWrapper
      tableHeaderHeight={tableHeaderHeight}
      root={root}
      instance={instance}
    >
      {content}
    </WorkspaceRowGroupWrapper>
  ) : (
    <div
      {...instance.getTableBodyProps({
        className: cx(styles.rowGroup, styles.tbody, styles.normalRowGroup)
      })}
    >
      {content}
    </div>
  )
}
