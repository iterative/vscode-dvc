import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { DragEvent, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Table, Header, ColumnOrderState } from '@tanstack/react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { MergedHeaderGroups } from './MergeHeaderGroups'
import { setDropTarget } from '../headerDropTargetSlice'
import { ExperimentsState } from '../../../store'
import { sendMessage } from '../../../../shared/vscode'
import {
  leafColumnIds,
  reorderColumnIds,
  isExperimentColumn
} from '../../../util/columns'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'
interface TableHeadProps {
  instance: Table<Experiment>
  root: HTMLElement | null
  onOrderChange: (order: ColumnOrderState) => void
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  setTableHeadHeight: (height: number) => void
}

export const TableHead = ({
  instance,
  root,
  onOrderChange,
  setExpColumnNeedsShadow,
  setTableHeadHeight
}: TableHeadProps) => {
  const { setColumnOrder, getHeaderGroups, getAllLeafColumns } = instance
  const headerGroups = getHeaderGroups()
  const allColumns = getAllLeafColumns()

  const headerDropTargetId = useSelector(
    (state: ExperimentsState) => state.headerDropTarget
  )
  const dispatch = useDispatch()

  const allHeaders: Header<Experiment, unknown>[] = []
  for (const headerGroup of headerGroups) {
    allHeaders.push(...headerGroup.headers)
  }

  const fullColumnOrder = useRef<string[]>()
  const draggingIds = useRef<string[]>()
  const wrapper = useRef<HTMLTableSectionElement>(null)

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
    cb: (displacedHeader: Header<Experiment, unknown>) => void
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
      onOrderChange(newOrder)
    }
  }

  return (
    <thead ref={wrapper}>
      {headerGroups.map(headerGroup => (
        <MergedHeaderGroups
          key={headerGroup.id}
          headerGroup={headerGroup}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          onDragLeave={onDragLeave}
          root={root}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
        />
      ))}
    </thead>
  )
}
