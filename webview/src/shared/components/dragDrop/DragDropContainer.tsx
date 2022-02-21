import React, { DragEvent } from 'react'

interface DragDropContainerProps {
  order: string[]
  setOrder: (order: string[]) => void
  disabledDropIds: string[]
  items: JSX.Element[] // Every item must have a id prop for drag and drop to work
}

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  order,
  setOrder,
  disabledDropIds,
  items
}) => {
  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const id = order.indexOf(e.currentTarget.id).toString()
    e.dataTransfer.setData('itemIndex', id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) =>
    e.preventDefault()

  const handleOnDrop = (e: DragEvent<HTMLElement>) => {
    const droppedIndex = order.indexOf(e.currentTarget.id)

    if (!disabledDropIds.includes(order[droppedIndex])) {
      const draggedIndex = parseInt(e.dataTransfer.getData('itemIndex'), 10)
      const newOrder = [...order]
      const dragged = newOrder[draggedIndex]

      newOrder.splice(draggedIndex, 1)
      newOrder.splice(droppedIndex, 0, dragged)

      setOrder(newOrder)
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
              onDragOver={handleDragOver}
              onDrop={handleOnDrop}
              draggable={!disabledDropIds.includes(item.props.id)}
            />
          )
      )}
    </>
  )
}
