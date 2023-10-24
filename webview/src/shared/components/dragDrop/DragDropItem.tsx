import React, { DragEvent } from 'react'

export interface DragDropItemProps {
  id: string
  draggable: JSX.Element
  onDragStart: (e: DragEvent<HTMLElement>) => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDragEnter: (e: DragEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  onDragLeave: (e: DragEvent<HTMLElement>) => void
  cleanup: () => void
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
  cleanup,
  disabledDropIds,
  shouldShowOnDrag,
  draggedId,
  isDiv
}) => {
  const Type = isDiv ? 'div' : draggable.type
  return (
    draggable && (
      <Type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={(draggable as any).ref}
        {...draggable.props}
        onDragStart={onDragStart}
        onDragEnd={cleanup}
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
  )
}
