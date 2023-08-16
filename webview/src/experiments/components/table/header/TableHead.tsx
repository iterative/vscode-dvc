import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { DragEvent, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Header,
  HeaderGroup,
  Updater,
  ColumnOrderState
} from '@tanstack/react-table'
import { MergedHeaderGroups } from './MergeHeaderGroups'
import { setDropTarget } from '../../../state/headerDropTargetSlice'
import { ExperimentsState } from '../../../store'
import {
  leafColumnIds,
  reorderColumnIds,
  isExperimentColumn
} from '../../../util/columns'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'
import styles from '../styles.module.scss'
import { reorderColumns } from '../../../util/messages'

interface TableHeadProps {
  headerGroups: HeaderGroup<Experiment>[]
  columnOrder: string[]
  setColumnOrder: (updater: Updater<ColumnOrderState>) => void
  root: HTMLElement | null
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  setTableHeadHeight: (height: number) => void
}

export const TableHead = ({
  columnOrder,
  headerGroups,
  setColumnOrder,
  root,
  setExpColumnNeedsShadow,
  setTableHeadHeight
}: TableHeadProps) => {
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
      fullColumnOrder.current = columnOrder
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
      reorderColumns(newOrder)
      onDragEnd()
    }
  }

  return (
    <thead className={styles.experimentsThead} ref={wrapper}>
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
          onlyOneLine={headerGroups.length === 1}
        />
      ))}
    </thead>
  )
}
