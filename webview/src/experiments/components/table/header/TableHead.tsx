import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { DragEvent, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { HeaderGroup, TableInstance } from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { MergedHeaderGroups } from './MergeHeaderGroups'
import { setDropTarget } from '../headerDropTargetSlice'
import styles from '../styles.module.scss'
import { Indicators } from '../Indicators'
import { useColumnOrder } from '../../../hooks/useColumnOrder'
import { ExperimentsState } from '../../../store'
import { sendMessage } from '../../../../shared/vscode'
import {
  leafColumnIds,
  reorderColumnIds,
  isExperimentColumn
} from '../../../util/columns'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'
import { getSelectedForPlotsCount } from '../../../util/rows'
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
  const headerDropTargetId = useSelector(
    (state: ExperimentsState) => state.headerDropTarget
  )
  const dispatch = useDispatch()
  const orderedColumns = useColumnOrder(columns, columnOrder)

  const allHeaders: HeaderGroup<Experiment>[] = []
  for (const headerGroup of headerGroups) {
    allHeaders.push(...headerGroup.headers)
  }

  const fullColumnOrder = useRef<string[]>()
  const draggingIds = useRef<string[]>()
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapperHeight = wrapper.current?.getBoundingClientRect().height
    if (wrapperHeight) {
      setTableHeadHeight(wrapperHeight)
    }
  }, [setTableHeadHeight, headerGroups])

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

  const onDragEnter = (e: DragEvent<HTMLElement>) => {
    findDisplacedHeader(e.currentTarget.id, displacedHeader => {
      if (!isExperimentColumn(displacedHeader.id)) {
        dispatch(setDropTarget(displacedHeader.id))
      }
    })
  }

  const onDragEnd = () => {
    fullColumnOrder.current = undefined
    draggingIds.current = undefined
    dispatch(setDropTarget(''))
  }

  const onDragLeave = () => {
    // note: for this to work it's important to have `pointer-events: none;`
    // on text children to avoid duplicate dragEnter and dragLeave events fired
    dispatch(setDropTarget(''))
  }

  const onDrop = () => {
    const fullOrder = fullColumnOrder.current
    const displacer = draggingIds.current
    let newOrder: string[] = []
    const displacedHeader = allHeaders.find(
      header => header.id === headerDropTargetId
    )

    if (fullOrder && displacer && displacedHeader) {
      const leafs = leafColumnIds(displacedHeader)
      newOrder = reorderColumnIds(fullOrder, displacer, leafs)

      setColumnOrder(newOrder)
      sendMessage({
        payload: newOrder,
        type: MessageFromWebviewType.REORDER_COLUMNS
      })
      onDragEnd()
    }
  }

  const selectedForPlotsCount = getSelectedForPlotsCount(rows)

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
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          onDragLeave={onDragLeave}
          root={root}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
        />
      ))}
    </div>
  )
}
