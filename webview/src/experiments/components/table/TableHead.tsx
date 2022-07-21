import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import cx from 'classnames'
import React, { useRef } from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { FilteredCounts } from 'dvc/src/experiments/model/filterBy/collect'
import { useInView } from 'react-intersection-observer'
import styles from './styles.module.scss'
import { MergedHeaderGroups } from './MergeHeaderGroups'
import { Indicators } from './Indicators'
import { useColumnOrder } from '../../hooks/useColumnOrder'
import { sendMessage } from '../../../shared/vscode'
import { leafColumnIds, reorderColumnIds } from '../../util/columns'
import {
  OnDragOver,
  OnDragStart
} from '../../../shared/components/dragDrop/DragDropWorkbench'
import { getSelectedForPlotsCount } from '../../util/rows'
import { isFirstInArr } from '../../util/isFirstInArr'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  columns: Column[]
  sorts: SortDefinition[]
  filteredCounts: FilteredCounts
  filters: string[]
  root: HTMLElement | null
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
}

export const TableHead = ({
  instance: {
    headerGroups,
    setColumnOrder,
    state: { columnOrder },
    allColumns,
    rows
  },
  root,
  filteredCounts,
  filters,
  columns,
  sorts,
  setExpColumnNeedsShadow
}: TableHeadProps) => {
  const orderedColumns = useColumnOrder(columns, columnOrder)
  const allHeaders: HeaderGroup<Experiment>[] = []
  for (const headerGroup of headerGroups) {
    allHeaders.push(...headerGroup.headers)
  }

  const fullColumnOrder = useRef<string[]>()
  const draggingIds = useRef<string[]>()

  const onDragStart: OnDragStart = draggedId => {
    const displacerHeader = allHeaders.find(header => header.id === draggedId)
    if (displacerHeader) {
      draggingIds.current = leafColumnIds(displacerHeader)
      fullColumnOrder.current = allColumns.map(({ id }) => id)
    }
  }

  const findDisplacedHeader = (
    draggedOverId: string,
    cb: (displacedHeader: HeaderGroup<Experiment>) => void
  ) => {
    const displacedHeader = allHeaders.find(
      header => header.id === draggedOverId
    )

    displacedHeader && cb(displacedHeader)
  }

  const onDragUpdate: OnDragOver = (_, draggedOverId: string) => {
    const displacer = draggingIds.current
    displacer &&
      findDisplacedHeader(draggedOverId, displacedHeader => {
        const displaced = leafColumnIds(displacedHeader)
        if (!displaced.some(id => displacer.includes(id))) {
          fullColumnOrder.current &&
            setColumnOrder(
              reorderColumnIds(fullColumnOrder.current, displacer, displaced)
            )
        }
      })
  }

  const onDragEnd = () => {
    draggingIds.current = undefined
    fullColumnOrder.current = undefined
    sendMessage({
      payload: columnOrder,
      type: MessageFromWebviewType.REORDER_COLUMNS
    })
  }
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: '-15px 0px 0px 0px',
    threshold: 1
  })

  const selectedForPlotsCount = getSelectedForPlotsCount(rows)

  return (
    <div
      className={cx(styles.thead, needsShadow && styles.headWithShadow)}
      ref={ref}
    >
      <Indicators
        selectedForPlotsCount={selectedForPlotsCount}
        sorts={sorts}
        filters={filters}
        filteredCounts={filteredCounts}
      />
      {headerGroups.map((headerGroup, ind) => (
        // eslint-disable-next-line react/jsx-key
        <MergedHeaderGroups
          {...headerGroup.getHeaderGroupProps()}
          orderedColumns={orderedColumns}
          headerGroup={headerGroup}
          columns={allHeaders}
          sorts={sorts}
          filters={filters}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
          root={root}
          isFirst={isFirstInArr(ind)}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
        />
      ))}
    </div>
  )
}
