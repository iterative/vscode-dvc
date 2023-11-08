import React, { DragEvent, createRef } from 'react'

interface DragDropItemProps {
  id: string
  draggable: JSX.Element
  onDragStart: (e: DragEvent<HTMLElement>) => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDragEnter: (e: DragEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  onDragLeave: (e: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  disabledDropIds: string[]
  shouldShowOnDrag?: boolean
  draggedId?: string
  isDiv?: boolean
}

export const DragDropItem: React.FC<DragDropItemProps> = ({
  id,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDrop,
  onDragLeave,
  onDragEnd,
  disabledDropIds,
  shouldShowOnDrag,
  draggedId,
  isDiv
}) => {
  const Type = isDiv ? 'div' : draggable.type
  const ref = createRef<HTMLDivElement>()

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    onDragStart(e)
    // Because the dragged element is being created while being dragged for plots in grids, there is a problem where
    // the dragend event is not being associated with the element. Re-adding the event makes sure it's being called.
    ref.current?.addEventListener('dragend', onDragEnd)
  }
  return (
    <Type
      // The draggable ref is used by the comparison table rows to set height and does not have the dragend event problem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={(draggable as any).ref || ref}
      {...draggable.props}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      draggable={!disabledDropIds.includes(id)}
      style={
        (!shouldShowOnDrag && id === draggedId && { display: 'none' }) ||
        draggable.props.style
      }
    />
  )
}
