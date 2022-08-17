import cx from 'classnames'
import React, {
  DragEvent,
  useEffect,
  useState,
  useRef,
  CSSProperties
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DragEnterDirection, getDragEnterDirection } from './util'
import { changeRef, setDraggedOverGroup } from './dragDropSlice'
import styles from './styles.module.scss'
import { DropTarget } from './DropTarget'
import { getIDIndex, getIDWithoutIndex } from '../../../util/ids'
import { Any } from '../../../util/objects'
import { PlotsState } from '../../../plots/store'
import { getStyleProperty } from '../../../util/styles'
import { idToNode } from '../../../util/helpers'

const orderIdxTune = (direction: DragEnterDirection, isAfter: boolean) => {
  if (direction === DragEnterDirection.RIGHT) {
    return isAfter ? 0 : 1
  }

  return isAfter ? -1 : 0
}

export const isSameGroup = (group1?: string, group2?: string) =>
  getIDWithoutIndex(group1) === getIDWithoutIndex(group2)

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
  parentDraggedOver
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const [draggedOverId, setDraggedOverId] = useState('')
  const [hoveringSomething, setHoveringSomething] = useState(false)
  const isHovering = useRef(false)
  const [draggedId, setDraggedId] = useState('')
  const [direction, setDirection] = useState(DragEnterDirection.LEFT)
  const { draggedRef, draggedOverGroup } = useSelector(
    (state: PlotsState) => state.dragAndDrop
  )
  const draggedOverIdTimeout = useRef<number>(0)
  const hoveringTimeout = useRef(0)
  const dispatch = useDispatch()

  const cleanup = () => {
    setHoveringSomething(false)
    isHovering.current = false
    setDraggedOverId('')
    setDraggedId('')
    setDirection(DragEnterDirection.LEFT)
  }

  useEffect(() => {
    return () => {
      clearTimeout(draggedOverIdTimeout.current)
      clearTimeout(hoveringTimeout.current)
    }
  }, [])

  useEffect(() => {
    cleanup()
  }, [order])

  if (items.length === 0) {
    return null
  }

  const createGhostStyle = (e: DragEvent<HTMLElement>) => {
    if (ghostElemStyle) {
      for (const [rule, value] of Object.entries(ghostElemStyle)) {
        const prop = getStyleProperty(rule)
        e.currentTarget.style[prop] = value
      }
    }
  }

  const resetDraggedStyle = (id: string) => {
    const elem = idToNode(id)
    if (elem && ghostElemStyle) {
      for (const [rule] of Object.entries(ghostElemStyle)) {
        const prop = getStyleProperty(rule)
        elem.style[prop] = ''
      }
    }
  }

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    const idx = order.indexOf(id)
    let toIdx = shouldShowOnDrag ? idx : idx + 1
    if (!shouldShowOnDrag && toIdx === order.length) {
      toIdx = idx - 1

      if (toIdx === -1) {
        toIdx = 0
      }
    }
    const itemIndex = idx.toString()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'

    createGhostStyle(e)
    draggedOverIdTimeout.current = window.setTimeout(() => {
      dispatch(
        changeRef({
          group,
          itemId: id,
          itemIndex
        })
      )
      setDraggedId(id)
      setDraggedOverId(order[toIdx])
      resetDraggedStyle(id)
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
  }

  const handleOnDrop = (e: DragEvent<HTMLElement>) => {
    e.stopPropagation()
    if (!draggedRef) {
      return
    }
    draggedOverIdTimeout.current = window.setTimeout(() => {
      setDraggedId('')
    }, 0)
    if (draggedRef.itemId === draggedOverId) {
      dispatch(changeRef(undefined))
      return
    }
    const isNew = !order.includes(draggedRef.itemId)
    const draggedIndex = isNew ? order.length : getIDIndex(draggedRef.itemIndex)

    const droppedIndex = order.indexOf(e.currentTarget.id.split('__')[0])
    const orderIdxChange = orderIdxTune(direction, droppedIndex > draggedIndex)
    const orderIdxChanged = droppedIndex + orderIdxChange
    const isEnabled = !disabledDropIds.includes(order[orderIdxChanged])

    if (isEnabled && isSameGroup(draggedRef.group, group)) {
      applyDrop(
        orderIdxChanged,
        draggedIndex,
        [...order],
        draggedRef.itemId,
        isNew
      )
    }
  }

  const setIsHovering = () => {
    setHoveringSomething(true)
    isHovering.current = true
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    setIsHovering()

    if (isSameGroup(draggedRef?.group, group)) {
      const { id } = e.currentTarget
      if (
        !disabledDropIds.includes(id) &&
        id !== draggedId &&
        !id.includes('__drop')
      ) {
        setDraggedOverId(id)
        setDirection(getDragEnterDirection(e))
        dispatch(setDraggedOverGroup(group))
      }
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    if (draggedOverId && e.currentTarget.id.includes(draggedOverId)) {
      setIsHovering()
    }
    if (isSameGroup(draggedRef?.group, group)) {
      const { id } = e.currentTarget
      !disabledDropIds.includes(id) &&
        id === draggedOverId &&
        setDirection(getDragEnterDirection(e))
    }
  }

  const handleDragEnd = () => {
    dispatch(changeRef(undefined))
    cleanup()
  }

  const handleDragLeave = () => {
    isHovering.current = false
    hoveringTimeout.current = window.setTimeout(() => {
      if (!isHovering.current) {
        setHoveringSomething(false)
      }
    }, 500)
  }

  const buildItem = (id: string, draggable: JSX.Element) => (
    <draggable.type
      key={draggable.key}
      {...draggable.props}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleOnDrop}
      onDragLeave={handleDragLeave}
      draggable={!disabledDropIds.includes(id)}
      style={
        (!shouldShowOnDrag && id === draggedId && { display: 'none' }) ||
        draggable.props.style
      }
    />
  )

  const getDropTargetClassNames = (isEnteringRight: boolean) =>
    shouldShowOnDrag
      ? cx(styles.dropTargetWhenShowingOnDrag, {
          [styles.dropTargetWhenShowingOnDragLeft]: !isEnteringRight,
          [styles.dropTargetWhenShowingOnDragRight]: isEnteringRight
        })
      : undefined

  const getTarget = (id: string, isEnteringRight: boolean) => (
    <DropTarget
      key="drop-target"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleOnDrop}
      id={id}
      className={getDropTargetClassNames(isEnteringRight)}
    >
      {dropTarget}
    </DropTarget>
  )

  const createItemWithDropTarget = (id: string, item: JSX.Element) => {
    const isEnteringRight = direction === DragEnterDirection.RIGHT
    const target =
      draggedOverGroup === group || draggedRef?.group === group
        ? getTarget(id, isEnteringRight)
        : null

    const itemWithTag = shouldShowOnDrag ? (
      <div key="item" {...item.props} />
    ) : (
      item
    )
    const block = isEnteringRight
      ? [itemWithTag, target]
      : [target, itemWithTag]

    return shouldShowOnDrag ? (
      <item.type key={item.key} className={styles.newBlockWhenShowingOnDrag}>
        {block}
      </item.type>
    ) : (
      block
    )
  }

  const wrappedItems = items.flatMap(draggable => {
    const { id } = draggable.props
    const item = id && buildItem(id, draggable)

    return id === draggedOverId && (hoveringSomething || !parentDraggedOver)
      ? createItemWithDropTarget(id, item)
      : item
  })

  if (
    isSameGroup(draggedRef?.group, group) &&
    !hoveringSomething &&
    parentDraggedOver
  ) {
    wrappedItems.push(
      getTarget(wrappedItems[wrappedItems.length - 1].props.id, false)
    )
  }

  const Wrapper = wrapperComponent?.component
  return Wrapper ? (
    <Wrapper {...wrapperComponent.props} items={wrappedItems} />
  ) : (
    <>{wrappedItems}</>
  )
}
