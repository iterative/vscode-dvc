import React, {
  DragEvent,
  useEffect,
  useState,
  useRef,
  DragEventHandler
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DragEnterDirection, getDragEnterDirection } from './util'
import { changeRef } from './dragDropSlice'
import { getIDIndex, getIDWithoutIndex } from '../../../util/ids'
import { Any } from '../../../util/objects'
import { ExperimentsRootState } from '../../../experiments/store'
import { PlotsRootState } from '../../../plots/store'

const orderIdxTune = (direction: DragEnterDirection, isAfter: boolean) => {
  if (direction === DragEnterDirection.RIGHT) {
    return isAfter ? 0 : 1
  }

  return isAfter ? -1 : 0
}

const isSameGroup = (group1?: string, group2?: string) =>
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

export type DropTargetInfo = {
  element: JSX.Element
  wrapperTag: 'div' | 'th'
}

export const makeTarget = (
  dropTarget: DropTargetInfo,
  handleDragOver: DragEventHandler<HTMLElement>,
  handleOnDrop: DragEventHandler<HTMLElement>,
  id: string
) => (
  <dropTarget.wrapperTag
    data-testid="drop-target"
    key="drop-target"
    onDragOver={handleDragOver}
    onDrop={handleOnDrop}
    id={`${id}__drop`}
  >
    {dropTarget.element}
  </dropTarget.wrapperTag>
)
interface DragDropContainerProps {
  order: string[]
  setOrder: (order: string[]) => void
  disabledDropIds?: string[]
  items: JSX.Element[] // Every item must have a id prop for drag and drop to work
  group: string
  onDrop?: OnDrop
  dropTarget: DropTargetInfo
  wrapperComponent?: {
    component: React.FC<WrapperProps>
    props: {
      [key: string]: Any
    }
  }
}

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  order,
  setOrder,
  disabledDropIds = [],
  items,
  group,
  onDrop,
  dropTarget,
  wrapperComponent
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const [draggedOverId, setDraggedOverId] = useState('')
  const [draggedId, setDraggedId] = useState('')
  const [direction, setDirection] = useState(DragEnterDirection.LEFT)
  const { draggedRef } = useSelector(
    (state: PlotsRootState | ExperimentsRootState) => state.dragAndDrop
  )
  const draggedOverIdTimeout = useRef<number>(0)
  const dispatch = useDispatch()

  const cleanup = () => {
    setDraggedOverId('')
    setDraggedId('')
    setDirection(DragEnterDirection.LEFT)
  }

  useEffect(() => {
    return () => clearTimeout(draggedOverIdTimeout.current)
  }, [])

  useEffect(() => {
    cleanup()
  }, [order])

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    const idx = order.indexOf(id)
    let toIdx = idx + 1
    if (toIdx === order.length) {
      toIdx = idx - 1

      if (toIdx === -1) {
        toIdx = 0
      }
    }
    const itemIndex = idx.toString()
    e.dataTransfer.setData('itemIndex', itemIndex)
    e.dataTransfer.setData('itemId', id)
    e.dataTransfer.setData('group', group)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    dispatch(
      changeRef({
        group,
        itemId: id,
        itemIndex
      })
    )
    draggedOverIdTimeout.current = window.setTimeout(() => {
      setDraggedId(id)
      setDraggedOverId(order[toIdx])
    }, 0)
  }

  const applyDrop = (
    e: DragEvent<HTMLElement>,
    droppedIndex: number,
    draggedIndex: number,
    newOrder: string[],
    oldDraggedId: string
  ) => {
    const dragged = newOrder[draggedIndex]

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(droppedIndex, 0, dragged)

    setOrder(newOrder)
    dispatch(changeRef(undefined))

    onDrop?.(oldDraggedId, e.dataTransfer.getData('group'), group, droppedIndex)
  }

  const handleOnDrop = (e: DragEvent<HTMLElement>) => {
    const newOrder = [...order]
    const oldDraggedId = e.dataTransfer.getData('itemId')
    const isNew = !order.includes(draggedId)
    if (isNew) {
      newOrder.push(draggedId)
    }
    const draggedIndex = isNew
      ? newOrder.length - 1
      : getIDIndex(e.dataTransfer.getData('itemIndex'))

    const droppedIndex = order.indexOf(e.currentTarget.id.split('__')[0])
    const orderIdxChange = orderIdxTune(direction, droppedIndex > draggedIndex)
    const orderIdxChanged = droppedIndex + orderIdxChange
    const isEnabled = !disabledDropIds.includes(order[orderIdxChanged])
    setDraggedId('')

    if (isEnabled && isSameGroup(e.dataTransfer.getData('group'), group)) {
      applyDrop(e, orderIdxChanged, draggedIndex, newOrder, oldDraggedId)
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    if (isSameGroup(draggedRef?.group, group)) {
      const { id } = e.currentTarget
      if (
        !disabledDropIds.includes(id) &&
        id !== draggedId &&
        !id.includes('__drop')
      ) {
        setDraggedOverId(id)
        setDirection(getDragEnterDirection(e))
      }
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    if (isSameGroup(draggedRef?.group, group)) {
      const { id } = e.currentTarget
      !disabledDropIds.includes(id) &&
        id === draggedOverId &&
        setDirection(getDragEnterDirection(e))
    }
  }

  const buildItem = (id: string, draggable: JSX.Element) => (
    <draggable.type
      key={draggable.key}
      {...draggable.props}
      onDragStart={handleDragStart}
      onDragEnd={cleanup}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleOnDrop}
      draggable={!disabledDropIds.includes(id)}
      style={(id === draggedId && { display: 'none' }) || draggable.props.style}
    />
  )

  const wrappedItems = items.flatMap(draggable => {
    const { id } = draggable.props
    const item = id && buildItem(id, draggable)

    if (id === draggedOverId) {
      const target = makeTarget(dropTarget, handleDragOver, handleOnDrop, id)

      return direction === DragEnterDirection.RIGHT
        ? [item, target]
        : [target, item]
    }

    return item
  })

  const Wrapper = wrapperComponent?.component
  return Wrapper ? (
    <Wrapper {...wrapperComponent.props} items={wrappedItems} />
  ) : (
    <>{wrappedItems}</>
  )
}
