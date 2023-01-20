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
import { ColumnWithGroup } from '../../../util/buildColumns'

const calcResizerHeight = (header: Header<Experiment, unknown>) =>
  `${100 + (header.depth - header.column.depth - 1) * 105}%`

const getHeaderPropsArgs = (
  header: Header<Experiment, unknown>,
  headerDropTargetId: string,
  sortEnabled: boolean,
  sortOrder: SortOrder,
  onlyOneLine?: boolean
) => {
  const columnWithGroup = header.column.columnDef as ColumnWithGroup
  return {
    className: cx(
      header.isPlaceholder ? styles.placeholderHeaderCell : styles.headerCell,
      {
        [styles.paramHeaderCell]: columnWithGroup.group === ColumnType.PARAMS,
        [styles.metricHeaderCell]: columnWithGroup.group === ColumnType.METRICS,
        [styles.depHeaderCell]: columnWithGroup.group === ColumnType.DEPS,
        [styles.firstLevelHeader]: isFirstLevelHeader(header.column.id),
        [styles.leafHeader]: header.subHeaders === undefined,
        [styles.menuEnabled]: sortEnabled,
        [styles.sortingHeaderCellAsc]: sortOrder === SortOrder.ASCENDING,
        [styles.sortingHeaderCellDesc]:
          sortOrder === SortOrder.DESCENDING && !header.isPlaceholder,
        [styles.oneRowHeaderCell]: onlyOneLine
      },
      headerDropTargetId === header.id && styles.headerCellDropTarget
    ),
    style: {
      position: undefined
    }
  }
}

const WithExpColumnNeedsShadowUpdates: React.FC<{
  children: ReactNode
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({ root, setExpColumnNeedsShadow, children }) => {
  const [ref, needsShadow] = useInView({
    initialInView: true,
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
  onlyOneLine?: boolean
}> = ({
  header,
  hasFilter,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  onDragLeave,
  root,
  setExpColumnNeedsShadow,
  onlyOneLine
}) => {
  const {
    colSpan,
    column: { getCanResize, id },
    isPlaceholder,
    getSize,
    depth
  } = header
  const [menuSuppressed, setMenuSuppressed] = useState<boolean>(false)
  const headerDropTargetId = useSelector(
    (state: ExperimentsState) => state.headerDropTarget
  )
  const { sorts } = useSelector((state: ExperimentsState) => state.tableData)

  const { menuEnabled, isSortable, sortOrder } = useMemo(() => {
    return getMenuOptions(header, sorts)
  }, [header, sorts])
  const isDraggable = !isPlaceholder && !isExperimentColumn(id)

  const canResize = getCanResize() && !isPlaceholder
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
  const previousPlaceholder = isPlaceholder
    ? `_previous_placeholder_${depth}`
    : ''

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
          sortOrder,
          onlyOneLine
        )}
        data-testid={`header-${id}${previousPlaceholder}`}
        key={id}
        tabIndex={0}
        colSpan={colSpan}
        style={{
          width: getSize()
        }}
      >
        {isExperimentColumn(id) ? (
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
