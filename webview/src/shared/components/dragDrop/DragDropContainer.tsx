import React, { DragEvent, MutableRefObject } from 'react'
import { getIDIndex, getIDWithoutIndex } from '../../../util/ids'

export type DraggedInfo = {
  itemIndex: string
  itemId: string
  group: string
}

interface DragDropContainerProps {
  order: string[]
  setOrder: (order: string[]) => void
  disabledDropIds?: string[]
  items: JSX.Element[] // Every item must have a id prop for drag and drop to work
  group: string
  onDrop?: (draggedId: string, draggedGroup: string, groupId: string) => void
  draggedRef?: MutableRefObject<DraggedInfo | undefined>
}

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  order,
  setOrder,
  disabledDropIds = [],
  items,
  group,
  onDrop,
  draggedRef
}) => {
  const setDraggedRef = (draggedInfo?: DraggedInfo) => {
    if (draggedRef) {
      draggedRef.current = draggedInfo
    }
  }

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const idx = order.indexOf(e.currentTarget.id).toString()
    e.dataTransfer.setData('itemIndex', idx)
    e.dataTransfer.setData('itemId', e.currentTarget.id)
    e.dataTransfer.setData('group', group)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    setDraggedRef({
      group,
      itemId: e.currentTarget.id,
      itemIndex: idx
    })
  }

  const applyDrop = (e: DragEvent<HTMLElement>, droppedIndex: number) => {
    const newOrder = [...order]
    const draggedId = e.dataTransfer.getData('itemId')
    const isNew = !order.includes(draggedId)
    if (isNew) {
      newOrder.push(draggedId)
    }
    const draggedIndex = isNew
      ? newOrder.length - 1
      : getIDIndex(e.dataTransfer.getData('itemIndex'))
    const dragged = newOrder[draggedIndex]

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(droppedIndex, 0, dragged)

    setOrder(newOrder)
    setDraggedRef(undefined)
    onDrop?.(draggedId, e.dataTransfer.getData('group'), group)
  }

  const handleOnDrop = (e: DragEvent<HTMLElement>) => {
    const droppedIndex = order.indexOf(e.currentTarget.id)
    const draggedGroup = getIDWithoutIndex(e.dataTransfer.getData('group'))
    const isSameGroup = draggedGroup === getIDWithoutIndex(group)
    const isEnabled = !disabledDropIds.includes(order[droppedIndex])

    if (isEnabled && isSameGroup) {
      applyDrop(e, droppedIndex)
    }
  }

  return (
    <>
      {items.map(
        item =>
          item.props.id && (
            <item.type
              key={item.key}
              {...item.props}
              onDragStart={handleDragStart}
              onDragOver={(e: DragEvent<HTMLElement>) => e.preventDefault()}
              onDrop={handleOnDrop}
              draggable={!disabledDropIds.includes(item.props.id)}
            />
          )
      )}
    </>
  )
}
