import React, { DragEvent } from 'react'

export type DragFunction = (e: DragEvent<HTMLElement>) => void

interface DraggableProps {
  id: string
  disabled: boolean
  children: JSX.Element
  onDrop: DragFunction
  onDragStart: DragFunction
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragLeave: DragFunction
}

export const Draggable: React.FC<DraggableProps> = ({
  id,
  children,
  disabled,
  onDrop,
  onDragEnter,
  onDragStart,
  onDragEnd,
  onDragLeave
}) => {
  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    onDragStart(e)
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  return (
    <children.type
      {...children.props}
      id={id}
      onDragLeave={onDragLeave}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      draggable={!disabled}
    />
  )
}
