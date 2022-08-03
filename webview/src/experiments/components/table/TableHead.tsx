import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { DragEvent, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { HeaderGroup, TableInstance } from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { MergedHeaderGroups } from './MergeHeaderGroups'
import { Indicators } from './Indicators'
import { useColumnOrder } from '../../hooks/useColumnOrder'
import { ExperimentsState } from '../../store'
import { sendMessage } from '../../../shared/vscode'
import { leafColumnIds, reorderColumnIds } from '../../util/columns'
import { DragFunction } from '../../../shared/components/dragDrop/Draggable'
import { getSelectedForPlotsCount } from '../../util/rows'
interface TableHeadProps {
  instance: TableInstance<Experiment>
  root: HTMLElement | null
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  setTableHeadHeight: (height: number) => void
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
  setExpColumnNeedsShadow,
  setTableHeadHeight
}: TableHeadProps) => {
  const columns = useSelector(
    (state: ExperimentsState) => state.tableData.columns
  )
  const orderedColumns = useColumnOrder(columns, columnOrder)
  const allHeaders: HeaderGroup<Experiment>[] = []
  for (const headerGroup of headerGroups) {
    allHeaders.push(...headerGroup.headers)
  }

  const fullColumnOrder = useRef<string[]>()
  const draggingIds = useRef<string[]>()

  const onDragStart: DragFunction = ({ currentTarget }) => {
    const displacerHeader = allHeaders.find(
      header => header.id === currentTarget.id
    )
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

  const onDragUpdate = (e: DragEvent<HTMLElement>) => {
    const displacer = draggingIds.current
    displacer &&
      findDisplacedHeader(e.currentTarget.id, displacedHeader => {
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

  const selectedForPlotsCount = getSelectedForPlotsCount(rows)

  const firstExpColumnCellId = headerGroups[0].headers[0].id

  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapperHeight = wrapper.current?.getBoundingClientRect().height
    if (wrapperHeight) {
      setTableHeadHeight(wrapperHeight)
    }
  }, [setTableHeadHeight])

  return (
    <div className={styles.thead} ref={wrapper}>
      <Indicators selectedForPlotsCount={selectedForPlotsCount} />
      {headerGroups.map(headerGroup => (
        // eslint-disable-next-line react/jsx-key
        <MergedHeaderGroups
          {...headerGroup.getHeaderGroupProps()}
          orderedColumns={orderedColumns}
          headerGroup={headerGroup}
          columns={allHeaders}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
          root={root}
          firstExpColumnCellId={firstExpColumnCellId}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
        />
      ))}
    </div>
  )
}
