import React, { DragEvent, MutableRefObject, useEffect, useState } from 'react'
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
  dropTarget?: JSX.Element
}

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  order,
  setOrder,
  disabledDropIds = [],
  items,
  group,
  onDrop,
  draggedRef,
  dropTarget
}) => {
  const [draggedOverId, setDraggedOverId] = useState('')
  const [draggedId, setDraggedId] = useState('')
  let dragIdTimeout = 0

  useEffect(() => {
    return () => clearTimeout(dragIdTimeout)
  })

  const setDraggedRef = (draggedInfo?: DraggedInfo) => {
    if (draggedRef) {
      draggedRef.current = draggedInfo
    }
  }

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    const idx = order.indexOf(id).toString()
    e.dataTransfer.setData('itemIndex', idx)
    e.dataTransfer.setData('itemId', id)
    e.dataTransfer.setData('group', group)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    setDraggedRef({
      group,
      itemId: id,
      itemIndex: idx
    })
    setDraggedOverId(id)
    dragIdTimeout = window.setTimeout(() => setDraggedId(id), 0)
  }

  const handleDragEnd = () => {
    setDraggedOverId('')
    setDraggedId('')
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
    const id = e.currentTarget.id.split('_')[0]
    const droppedIndex = order.indexOf(id)
    const draggedGroup = getIDWithoutIndex(e.dataTransfer.getData('group'))
    const isSameGroup = draggedGroup === getIDWithoutIndex(group)
    const isEnabled = !disabledDropIds.includes(order[droppedIndex])

    if (isEnabled && isSameGroup) {
      applyDrop(e, droppedIndex)
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    id !== draggedId && setDraggedOverId(id)
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => e.preventDefault()

  const isAfter = order.indexOf(draggedId) < order.indexOf(draggedOverId)

  const buildItem = (id: string, draggable: JSX.Element) => (
    <draggable.type
      key={draggable.key}
      {...draggable.props}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleOnDrop}
      draggable={!disabledDropIds.includes(id)}
      style={(id === draggedId && { display: 'none' }) || draggable.props.style}
    />
  )

  return (
    <>
      {items.flatMap(draggable => {
        const { id } = draggable.props
        const item = id && buildItem(id, draggable)

        if (id === draggedOverId && dropTarget) {
          const target = (
            <div
              data-testid="drop-target"
              key="drop-target"
              onDragOver={handleDragOver}
              onDrop={handleOnDrop}
              id={`${id}_drop`}
            >
              {dropTarget}
            </div>
          )
          return isAfter ? [item, target] : [target, item]
        }

        return item
      })}
    </>
  )
}
