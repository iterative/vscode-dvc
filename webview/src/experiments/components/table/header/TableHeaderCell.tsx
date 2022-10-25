import {
  Experiment,
  Column,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
import { SortOrder } from './TableHeader'
import { TableHeaderCellContents } from './TableHeaderCellContents'
import styles from '../styles.module.scss'
import {
  countUpperLevels,
  isExperimentColumn,
  isFirstLevelHeader
} from '../../../util/columns'
import { ExperimentsState } from '../../../store'
import { ContextMenu } from '../../../../shared/components/contextMenu/ContextMenu'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

const calcResizerHeight = (
  isPlaceholder: boolean,
  orderedColumns: Column[],
  column: HeaderGroup<Experiment>,
  columns: HeaderGroup<Experiment>[]
) => {
  const nbUpperLevels = isPlaceholder
    ? 0
    : countUpperLevels(orderedColumns, column, columns, 0)
  return 100 + nbUpperLevels * 105 + '%'
}

const getHeaderPropsArgs = (
  column: HeaderGroup<Experiment>,
  sortEnabled: boolean,
  sortOrder: SortOrder
) => {
  return {
    className: cx(
      styles.th,
      column.placeholderOf ? styles.placeholderHeaderCell : styles.headerCell,
      {
        [styles.paramHeaderCell]: column.group === ColumnType.PARAMS,
        [styles.metricHeaderCell]: column.group === ColumnType.METRICS,
        [styles.depHeaderCell]: column.group === ColumnType.DEPS,
        [styles.firstLevelHeader]: isFirstLevelHeader(column.id),
        [styles.leafHeader]: column.headers === undefined,
        [styles.menuEnabled]: sortEnabled,
        [styles.sortingHeaderCellAsc]:
          sortOrder === SortOrder.ASCENDING && !column.parent?.placeholderOf,
        [styles.sortingHeaderCellDesc]:
          sortOrder === SortOrder.DESCENDING && !column.placeholderOf
      }
    ),
    style: {
      position: undefined
    }
  }
}

const WithExpColumnNeedsShadowUpdates: React.FC<{
  children: React.ReactNode
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
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  hasFilter: boolean
  orderedColumns: Column[]
  sortOrder: SortOrder
  sortEnabled: boolean
  menuDisabled?: boolean
  menuContent?: React.ReactNode
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({
  column,
  columns,
  orderedColumns,
  hasFilter,
  sortOrder,
  sortEnabled,
  menuContent,
  menuDisabled,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  root,
  setExpColumnNeedsShadow
}) => {
  const [menuSuppressed, setMenuSuppressed] = React.useState<boolean>(false)
  const headerDropTargetId = useSelector(
    (state: ExperimentsState) => state.headerDropTarget
  )
  const isDraggable = !column.placeholderOf && column.id !== 'id'

  const isPlaceholder = !!column.placeholderOf

  const canResize = column.canResize && !isPlaceholder
  const resizerHeight = calcResizerHeight(
    isPlaceholder,
    orderedColumns,
    column,
    columns
  )

  const cellContents = (
    <TableHeaderCellContents
      column={column}
      sortOrder={sortOrder}
      sortEnabled={sortEnabled}
      hasFilter={hasFilter}
      isDraggable={isDraggable}
      menuSuppressed={menuSuppressed}
      onDragEnter={onDragEnter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      canResize={canResize}
      setMenuSuppressed={setMenuSuppressed}
      resizerHeight={resizerHeight}
    />
  )

  return (
    <ContextMenu
      content={menuContent}
      disabled={menuDisabled || menuSuppressed}
      trigger={'contextmenu'}
    >
      <div
        {...column.getHeaderProps(
          getHeaderPropsArgs(column, sortEnabled, sortOrder)
        )}
        data-testid={`header-${column.id}`}
        key={column.id}
        role="columnheader"
        tabIndex={0}
      >
        {isExperimentColumn(column.id) ? (
          <WithExpColumnNeedsShadowUpdates
            setExpColumnNeedsShadow={setExpColumnNeedsShadow}
            root={root}
          >
            {cellContents}
          </WithExpColumnNeedsShadowUpdates>
        ) : (
          cellContents
        )}
        <div
          className={cx(
            styles.dropTarget,
            headerDropTargetId === column.id && styles.active
          )}
        />
      </div>
    </ContextMenu>
  )
}
