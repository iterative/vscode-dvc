import cx from 'classnames'
import React, {
  DragEvent,
  useEffect,
  useState,
  useRef,
  CSSProperties,
  useCallback,
  useLayoutEffect
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  DragEnterDirection,
  getDragEnterDirection,
  isEnteringAfter,
  isExactGroup,
  isSameGroup
} from './util'
import { changeRef, setDraggedOverGroup } from './dragDropSlice'
import styles from './styles.module.scss'
import { DropTarget } from './DropTarget'
import { DragDropItemWithTarget } from './DragDropItemWithTarget'
import { DragDropItem } from './DragDropItem'
import { getIDIndex } from '../../../util/ids'
import { Any } from '../../../util/objects'
import { PlotsState } from '../../../plots/store'
import { getStyleProperty } from '../../../util/styles'
import { idToNode } from '../../../util/helpers'
import { useDeferedDragLeave } from '../../hooks/useDeferedDragLeave'

const orderIdxTune = (direction: DragEnterDirection, isAfter: boolean) => {
  if (isEnteringAfter(direction)) {
    return isAfter ? 0 : 1
  }

  return isAfter ? -1 : 0
}

const setStyle = (elem: HTMLElement, style: CSSProperties, reset?: boolean) => {
  for (const [rule, value] of Object.entries(style)) {
    elem.style[getStyleProperty(rule)] = reset ? '' : value
  }
}

export type WrapperProps = {
  items: JSX.Element[]
}

export type OnDrop = (
  draggedId: string,
  draggedGroup: string,
  groupId: string,
  position: number
) => void
interface DragDropContainerProps {
  order: string[]
  setOrder: (order: string[]) => void
  disabledDropIds?: string[]
  items: JSX.Element[] // Every item must have a id prop for drag and drop to work
  group: string
  onDrop?: OnDrop
  dropTarget: JSX.Element
  wrapperComponent?: {
    component: React.FC<WrapperProps>
    props: {
      [key: string]: Any
    }
  }
  shouldShowOnDrag?: boolean
  ghostElemStyle?: CSSProperties
  parentDraggedOver?: boolean
  vertical?: boolean
  onLayoutChange?: () => void
  onDragEnd?: () => void
}

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  order,
  setOrder,
  disabledDropIds = [],
  items,
  group,
  onDrop,
  dropTarget,
  wrapperComponent,
  shouldShowOnDrag,
  ghostElemStyle,
  parentDraggedOver,
  vertical,
  onLayoutChange,
  onDragEnd
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const defaultDragEnterDirection = vertical
    ? DragEnterDirection.TOP
    : DragEnterDirection.LEFT

  const [draggedOverId, setDraggedOverId] = useState('')
  const {
    hoveringSomething,
    immediateDragLeave,
    immediateDragEnter,
    deferedDragLeave
  } = useDeferedDragLeave()
  const [draggedId, setDraggedId] = useState('')
  const [direction, setDirection] = useState(defaultDragEnterDirection)
  const { draggedRef, draggedOverGroup } = useSelector(
    (state: PlotsState) => state.dragAndDrop
  )
  const draggedOverIdTimeout = useRef<number>(0)
  const pickedUp = useRef<boolean>(false)
  const dispatch = useDispatch()

  const cleanup = useCallback(() => {
    immediateDragLeave()

    if (pickedUp.current) {
      setDraggedOverId('')
      setDraggedId('')
      setDirection(defaultDragEnterDirection)
      pickedUp.current = false
      dispatch(changeRef(undefined))
    }
  }, [
    setDraggedOverId,
    setDirection,
    defaultDragEnterDirection,
    immediateDragLeave,
    dispatch
  ])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!e.buttons && pickedUp.current) {
        cleanup()
      }
    }
    document.addEventListener('mousemove', onMove)
    return () => {
      clearTimeout(draggedOverIdTimeout.current)
      document.removeEventListener('mousemove', onMove)
    }
  }, [cleanup])

  useEffect(() => {
    cleanup()
  }, [cleanup])

  useLayoutEffect(() => {
    onLayoutChange?.()
  })

  if (items.length === 0) {
    return null
  }

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    pickedUp.current = true
    const { id } = e.currentTarget
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
      setDraggedId(id)
      setDraggedOverId(order[toIdx])
      const elem = idToNode(id)
      ghostElemStyle && elem && setStyle(elem, ghostElemStyle, true)
    }, 0)
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
      setDraggedId('')
    }, 0)
    const dragged = draggedRef.itemId
    if (dragged === draggedOverId) {
      cleanup()
      return
    }
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

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    immediateDragEnter()

    if (isSameGroup(draggedRef?.group, group)) {
      const { id } = e.currentTarget
      if (
        !disabledDropIds.includes(id) &&
        id !== draggedId &&
        !id.includes('__drop')
      ) {
        setDraggedOverId(id)
        setDirection(getDragEnterDirection(e, vertical))
        dispatch(setDraggedOverGroup(group))
      }
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    if (draggedOverId && e.currentTarget.id.includes(draggedOverId)) {
      immediateDragEnter()
    }
    if (isSameGroup(draggedRef?.group, group)) {
      const { id } = e.currentTarget
      !disabledDropIds.includes(id) &&
        id === draggedOverId &&
        setDirection(getDragEnterDirection(e, vertical))
    }
  }

  const handleDragLeave = () => {
    deferedDragLeave()
  }

  const getDropTargetClassNames = (isEnteringRight: boolean) =>
    shouldShowOnDrag
      ? cx(styles.dropTargetWhenShowingOnDrag, {
          [styles.dropTargetWhenShowingOnDragLeft]: !isEnteringRight,
          [styles.dropTargetWhenShowingOnDragRight]: isEnteringRight
        })
      : undefined

  const getTarget = (
    id: string,
    isEnteringRight: boolean,
    wrapper: JSX.Element
  ) => (
    <DropTarget
      key={`drop-target-${id}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleOnDrop}
      id={id}
      className={getDropTargetClassNames(isEnteringRight)}
      wrapper={wrapper}
    >
      {dropTarget}
    </DropTarget>
  )

  const handleDragEnd = () => {
    onDragEnd?.()
    cleanup()
  }

  const wrappedItems = items
    .map(draggable => {
      if (!draggable) {
        return
      }
      const id = draggable.props.id
      const isDraggedOver =
        id === draggedOverId && (hoveringSomething || !parentDraggedOver)

      const item = (
        <DragDropItem
          key={draggable.key}
          onDragEnd={handleDragEnd}
          disabledDropIds={disabledDropIds}
          draggable={draggable}
          id={id}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleOnDrop}
          draggedId={draggedId}
          shouldShowOnDrag={shouldShowOnDrag}
          isDiv={isDraggedOver && shouldShowOnDrag}
        />
      )

      if (isDraggedOver) {
        const isAfter = isEnteringAfter(direction)
        const target = isExactGroup(draggedOverGroup, draggedRef?.group, group)
          ? getTarget(
              id,
              isAfter,
              shouldShowOnDrag ? <div /> : <draggable.type />
            )
          : null

        return (
          <DragDropItemWithTarget
            key={draggable.key}
            isAfter={isAfter}
            dropTarget={target}
            shouldShowOnDrag={shouldShowOnDrag}
            draggable={draggable}
          >
            {item}
          </DragDropItemWithTarget>
        )
      }

      return item
    })
    .filter(Boolean) as JSX.Element[]

  if (
    isSameGroup(draggedRef?.group, group) &&
    !hoveringSomething &&
    parentDraggedOver
  ) {
    const lastItem = items[items.length - 1]
    wrappedItems.push(getTarget(lastItem.props.id, false, <lastItem.type />))
  }

  const Wrapper = wrapperComponent?.component
  return Wrapper ? (
    <Wrapper {...wrapperComponent.props} items={wrappedItems} />
  ) : (
    <>{wrappedItems}</>
  )
}
