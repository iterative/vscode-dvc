import { Experiment, ColumnType } from 'dvc/src/experiments/webview/contract'
import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Header } from '@tanstack/react-table'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
import { TableHeaderCellContents } from './TableHeaderCellContents'
import {
  ContextMenuContent,
  getMenuOptions,
  SortOrder
} from './ContextMenuContent'
import styles from '../styles.module.scss'
import { isExperimentColumn, isFirstLevelHeader } from '../../../util/columns'
import { ExperimentsState } from '../../../store'
import { ContextMenu } from '../../../../shared/components/contextMenu/ContextMenu'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

const calcResizerHeight = (header: Header<Experiment, unknown>) =>
  100 + (header.depth - header.column.depth - 1) * 105 + '%'

const getHeaderPropsArgs = (
  header: Header<Experiment, unknown>,
  headerDropTargetId: string,
  sortEnabled: boolean,
  sortOrder: SortOrder
) => ({
  className: cx(
    header.isPlaceholder ? styles.placeholderHeaderCell : styles.headerCell,
    {
      [styles.paramHeaderCell]:
        header.column.columnDef.group === ColumnType.PARAMS,
      [styles.metricHeaderCell]:
        header.column.columnDef.group === ColumnType.METRICS,
      [styles.depHeaderCell]: header.column.columnDef.group === ColumnType.DEPS,
      [styles.firstLevelHeader]: isFirstLevelHeader(header.column.id),
      [styles.leafHeader]: header.subHeaders === undefined,
      [styles.menuEnabled]: sortEnabled,
      [styles.sortingHeaderCellAsc]:
        sortOrder ===
        SortOrder.ASCENDING /*&& !column.column.parent.isPlaceholder*/,
      [styles.sortingHeaderCellDesc]:
        sortOrder === SortOrder.DESCENDING && !header.isPlaceholder
    },
    headerDropTargetId === header.id && styles.headerCellDropTarget
  ),
  style: {
    position: undefined
  }
})

const WithExpColumnNeedsShadowUpdates: React.FC<{
  children: ReactNode
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({ root, setExpColumnNeedsShadow, children }) => {
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: '0px 0px 0px -15px',
    threshold: 1
  })

  useEffect(() => {
    setExpColumnNeedsShadow(needsShadow)
  }, [needsShadow, setExpColumnNeedsShadow])

  return <div ref={ref}>{children}</div>
}

export const TableHeaderCell: React.FC<{
  header: Header<Experiment, unknown>
  hasFilter: boolean
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  onDragLeave: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({
  header,
  hasFilter,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  onDragLeave,
  root,
  setExpColumnNeedsShadow
}) => {
  const [menuSuppressed, setMenuSuppressed] = useState<boolean>(false)
  const headerDropTargetId = useSelector(
    (state: ExperimentsState) => state.headerDropTarget
  )
  const { sorts } = useSelector((state: ExperimentsState) => state.tableData)

  const { menuEnabled, isSortable, sortOrder } = useMemo(() => {
    return getMenuOptions(header, sorts)
  }, [header, sorts])

  const isDraggable = !header.isPlaceholder && !isExperimentColumn(header.id)
  const { isPlaceholder } = header

  const canResize = header.column.getCanResize() && !isPlaceholder
  const resizerHeight = calcResizerHeight(header)

  const cellContents = (
    <TableHeaderCellContents
      header={header}
      sortOrder={sortOrder}
      sortEnabled={isSortable}
      hasFilter={hasFilter}
      isDraggable={isDraggable}
      menuSuppressed={menuSuppressed}
      onDragEnter={onDragEnter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      canResize={canResize}
      setMenuSuppressed={setMenuSuppressed}
      resizerHeight={resizerHeight}
    />
  )

  const menuContent = <ContextMenuContent header={header} />

  return (
    <ContextMenu
      content={menuContent}
      disabled={!menuEnabled || menuSuppressed}
      trigger={'contextmenu'}
    >
      <th
        {...getHeaderPropsArgs(
          header,
          headerDropTargetId,
          isSortable,
          sortOrder
        )}
        data-testid={`header-${header.id}`}
        key={header.id}
        role="columnheader"
        tabIndex={0}
        colSpan={header.colSpan}
        style={{
          width: header.getSize()
        }}
      >
        {isExperimentColumn(header.id) ? (
          <WithExpColumnNeedsShadowUpdates
            setExpColumnNeedsShadow={setExpColumnNeedsShadow}
            root={root}
          >
            {cellContents}
          </WithExpColumnNeedsShadowUpdates>
        ) : (
          cellContents
        )}
      </th>
    </ContextMenu>
  )
}
