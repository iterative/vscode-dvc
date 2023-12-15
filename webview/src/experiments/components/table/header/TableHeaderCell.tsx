import { Experiment, ColumnType } from 'dvc/src/experiments/webview/contract'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Header } from '@tanstack/react-table'
import cx from 'classnames'
import { TableHeaderCellContents } from './TableHeaderCellContents'
import { ContextMenuContent } from './ContextMenuContent'
import { getSortDetails } from './util'
import { WithExpColumnNeedsShadowUpdates } from './WithExpColumnNeedsShadowUpdates'
import styles from '../styles.module.scss'
import { Indicators } from '../Indicators'
import { ColumnWithGroup } from '../body/columns/Columns'
import {
  isDefaultColumn,
  isExperimentColumn,
  isFirstLevelHeader
} from '../../../util/columns'
import { ExperimentsState } from '../../../store'
import { ContextMenu } from '../../../../shared/components/contextMenu/ContextMenu'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

const getPercentResizer = (depth: number) => `${100 + depth * 105}%`

const calcResizerHeight = (header: Header<Experiment, unknown>) => {
  const originalDepth = header.depth - header.column.depth - 1
  let depth = originalDepth
  let column = header.column
  while (
    column.parent &&
    [...column.parent.getLeafColumns()].reverse()[0]?.id === column.id
  ) {
    depth++
    column = column.parent
  }
  return {
    hover: getPercentResizer(depth),
    normal: getPercentResizer(originalDepth)
  }
}

const getHeaderPropsArgs = (
  header: Header<Experiment, unknown>,
  headerDropTargetId: string,
  onlyOneLine?: boolean
) => {
  const columnWithGroup = header.column.columnDef as ColumnWithGroup
  return {
    className: cx(
      styles.experimentsTh,
      header.isPlaceholder ? styles.placeholderHeaderCell : styles.headerCell,
      {
        [styles.paramHeaderCell]: columnWithGroup.group === ColumnType.PARAMS,
        [styles.metricHeaderCell]: columnWithGroup.group === ColumnType.METRICS,
        [styles.depHeaderCell]: columnWithGroup.group === ColumnType.DEPS,
        [styles.firstLevelHeaderCell]: isFirstLevelHeader(header.column.id),
        [styles.leafHeaderCell]: header.subHeaders === undefined,
        [styles.oneRowHeaderCell]: onlyOneLine,
        [styles.dropTargetHeaderCell]: headerDropTargetId === header.id
      }
    ),
    style: {
      position: undefined
    }
  }
}

export const TableHeaderCell: React.FC<{
  header: Header<Experiment, unknown>
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
    depth
  } = header
  const [menuSuppressed, setMenuSuppressed] = useState<boolean>(false)
  const headerDropTargetId = useSelector(
    (state: ExperimentsState) => state.headerDropTarget
  )
  const { filters, sorts } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  const { isSortable, sortOrder } = useMemo(() => {
    return getSortDetails(header, sorts)
  }, [header, sorts])
  const isDraggable = !isPlaceholder && !isDefaultColumn(id)

  const hasFilter = !!(header.id && filters.includes(header.id))

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
      disabled={menuSuppressed}
      trigger="contextmenu"
    >
      <th
        {...getHeaderPropsArgs(header, headerDropTargetId, onlyOneLine)}
        data-testid={`header-${id}${previousPlaceholder}`}
        key={id}
        tabIndex={0}
        colSpan={colSpan}
      >
        {isExperimentColumn(id) ? (
          <WithExpColumnNeedsShadowUpdates
            setExpColumnNeedsShadow={setExpColumnNeedsShadow}
            root={root}
          >
            {depth === 1 && <Indicators />}
            {cellContents}
          </WithExpColumnNeedsShadowUpdates>
        ) : (
          cellContents
        )}
      </th>
    </ContextMenu>
  )
}
