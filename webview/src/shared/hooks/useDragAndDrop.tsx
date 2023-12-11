import React, {
  CSSProperties,
  DragEvent,
  useCallback,
  useRef,
  useState
} from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useDeferredDragLeave } from './useDeferredDragLeave'
import {
  DragEnterDirection,
  getDragEnterDirection,
  isEnteringAfter,
  isExactGroup,
  isSameGroup
} from '../components/dragDrop/util'
import { PlotsState } from '../../plots/store'
import {
  changeRef,
  setDirection,
  setDraggedOverGroup,
  setDraggedOverId
} from '../components/dragDrop/dragDropSlice'
import { getIDIndex } from '../../util/ids'
import { idToNode } from '../../util/helpers'
import { getStyleProperty } from '../../util/styles'
import { DropTarget } from '../components/dragDrop/DropTarget'
import styles from '../components/dragDrop/styles.module.scss'

type OnDrop = (
  draggedId: string,
  draggedGroup: string,
  groupId: string,
  position: number
) => void

interface DragAndDropProps {
  id: string
  disabledDropIds?: string[]
  shouldShowOnDrag?: boolean
  onDrop?: OnDrop
  onDragEnd?: () => void
  order: string[]
  setOrder: (order: string[]) => void
  group: string
  dropTarget: JSX.Element
  ghostElemStyle?: CSSProperties
  isParentDraggedOver?: boolean
  vertical?: boolean
  style?: CSSProperties
  type?: JSX.Element
}

const orderIdxTune = (
  direction: DragEnterDirection | undefined,
  isAfter: boolean
) => {
  if (direction && isEnteringAfter(direction)) {
    return isAfter ? 0 : 1
  }

  return isAfter ? -1 : 0
}

const setStyle = (elem: HTMLElement, style: CSSProperties, reset?: boolean) => {
  for (const [rule, value] of Object.entries(style)) {
    elem.style[getStyleProperty(rule)] = reset ? '' : value
  }
}

export const useDragAndDrop = ({
  id,
  disabledDropIds = [],
  shouldShowOnDrag,
  onDragEnd,
  vertical,
  group,
  onDrop,
  order,
  setOrder,
  ghostElemStyle,
  isParentDraggedOver,
  style,
  dropTarget,
  type // eslint-disable-next-line sonarjs/cognitive-complexity
}: DragAndDropProps) => {
  const [isDragged, setIsDragged] = useState(false)

  const {
    hoveringSomething,
    immediateDragLeave,
    immediateDragEnter,
    deferredDragLeave
  } = useDeferredDragLeave()
  const { draggedRef, draggedOverGroup, direction, draggedOverId } =
    useSelector((state: PlotsState) => state.dragAndDrop)
  const draggedOverIdTimeout = useRef<number>(0)

  const dispatch = useDispatch()

  const isDropTarget = id.includes('__drop')
  const isDisabled = disabledDropIds.includes(id)

  const isDraggedOver = draggedOverId === id
  const setIsDraggedOver = (isDraggedOver: boolean) =>
    isDraggedOver && dispatch(setDraggedOverId(id))

  const cleanup = useCallback(() => {
    immediateDragLeave()

    dispatch(setDraggedOverId(undefined))
    setIsDragged(false)
    dispatch(setDirection(undefined))
    dispatch(changeRef(undefined))
  }, [immediateDragLeave, dispatch])

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const defaultDragEnterDirection = vertical
      ? DragEnterDirection.TOP
      : DragEnterDirection.LEFT
    dispatch(setDirection(defaultDragEnterDirection))

    const idx = order.indexOf(id)
    let toIdx = shouldShowOnDrag ? idx : idx + 1
    if (!shouldShowOnDrag && toIdx === order.length) {
      toIdx = idx - 1

      if (toIdx === -1) {
        toIdx = 0
      }
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'

    ghostElemStyle && setStyle(e.currentTarget, ghostElemStyle)
    draggedOverIdTimeout.current = window.setTimeout(() => {
      dispatch(
        changeRef({
          group,
          itemId: id,
          itemIndex: idx.toString()
        })
      )
      setIsDragged(true)
      setIsDraggedOver(order[toIdx] === id)
      const elem = idToNode(id)
      ghostElemStyle && elem && setStyle(elem, ghostElemStyle, true)
    }, 0)
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    immediateDragEnter()

    if (isSameGroup(draggedRef?.group, group) && !isDisabled && !isDropTarget) {
      setIsDraggedOver(true)
      setIsDraggedOver(true)
      dispatch(setDirection(getDragEnterDirection(e, vertical)))
      dispatch(setDraggedOverGroup(group))
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    if (isDraggedOver) {
      immediateDragEnter()
    }
    if (isSameGroup(draggedRef?.group, group)) {
      !isDisabled &&
        isDraggedOver &&
        dispatch(setDirection(getDragEnterDirection(e, vertical)))
    }
  }

  const handleDragLeave = () => {
    setIsDraggedOver(false)
    deferredDragLeave()
  }

  const handleDragEnd = () => {
    onDragEnd?.()
    cleanup()
  }

  const applyDrop = (
    droppedIndex: number,
    draggedIndex: number,
    newOrder: string[],
    oldDraggedId: string,
    isNew: boolean
  ) => {
    if (isNew && draggedRef) {
      newOrder.push(draggedRef.itemId)
    }
    const dragged = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(droppedIndex, 0, dragged)
    setOrder(newOrder)
    dispatch(changeRef(undefined))

    onDrop?.(oldDraggedId, draggedRef?.group || '', group, droppedIndex)
    cleanup()
  }

  const handleOnDrop = (e: DragEvent<HTMLElement>) => {
    e.stopPropagation()
    if (!draggedRef) {
      return
    }
    draggedOverIdTimeout.current = window.setTimeout(() => {
      setIsDragged(false)
    }, 0)
    if (isDragged && isDraggedOver) {
      cleanup()
      return
    }

    const dragged = draggedRef.itemId
    const isNew = !order.includes(dragged)
    const draggedIndex = isNew ? order.length : getIDIndex(draggedRef.itemIndex)
    const droppedIndex = order.indexOf(e.currentTarget.id.split('__')[0])
    const orderIdxChange = orderIdxTune(direction, droppedIndex > draggedIndex)
    const orderIdxChanged = droppedIndex + orderIdxChange
    const isEnabled = !disabledDropIds.includes(order[orderIdxChanged])

    if (isEnabled && isSameGroup(draggedRef.group, group)) {
      applyDrop(orderIdxChanged, draggedIndex, [...order], dragged, isNew)
    }
  }

  const isBeingDraggedOver =
    isDraggedOver && (hoveringSomething || !isParentDraggedOver)

  const hasTarget =
    isBeingDraggedOver &&
    isExactGroup(draggedOverGroup, draggedRef?.group, group)
  const isAfter = isEnteringAfter(direction)

  const dropTargetClassNames = shouldShowOnDrag
    ? cx(styles.dropTargetWhenShowingOnDrag, {
        [styles.dropTargetWhenShowingOnDragLeft]: !isAfter,
        [styles.dropTargetWhenShowingOnDragRight]: isAfter
      })
    : undefined

  const target = hasTarget && (
    <DropTarget
      key={`drop-target-${id}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleOnDrop}
      id={id}
      className={dropTargetClassNames}
      wrapper={type}
    >
      {dropTarget}
    </DropTarget>
  )

  return {
    draggable: !disabledDropIds.includes(id),
    isAfter,
    onDragEnd: handleDragEnd,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDragStart: handleDragStart,
    onDrop: handleOnDrop,
    style:
      (!shouldShowOnDrag && isDragged && { ...style, display: 'none' }) ||
      style,
    target
  }
}
