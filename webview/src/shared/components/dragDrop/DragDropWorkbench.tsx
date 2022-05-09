import React, { DragEvent, useContext } from 'react'
import { DragDropContext, DragDropContextValue } from './DragDropContext'

export type OnDrop = (draggedId: string, draggedOverId: string) => void
export type OnDragStart = (draggedId: string) => void
export type OnDragOver = (draggedId: string, draggedOverId: string) => void

export interface DraggableProps {
  id: string
  group: string
  disabled: boolean
  dropTarget: {
    element: JSX.Element
    wrapperTag: 'div' | 'th'
  }
  children: JSX.Element
  onDrop?: OnDrop
  onDragStart?: OnDragStart
  onDragOver?: OnDragOver
}

export const Draggable: React.FC<DraggableProps> = ({
  id,
  group,
  children,
  disabled,
  dropTarget,
  onDrop,
  onDragOver,
  onDragStart
}) => {
  const { groupStates, setGroupState } =
    useContext<DragDropContextValue>(DragDropContext)

  const groupState = groupStates?.[group] || {}
  const { draggedOverId, draggedId } = groupState

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    setGroupState?.(group, {
      ...groupState,
      draggedId: id
    })
    onDragStart?.(id)
  }

  const handleOnDrop = () => {
    !disabled &&
      draggedId &&
      draggedOverId &&
      onDrop?.(draggedId, draggedOverId)
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    if (!disabled && draggedId && id !== draggedId && id !== draggedOverId) {
      setGroupState?.(group, {
        ...groupState,
        draggedOverId: id
      })
      onDragOver?.(draggedId, id)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
    setGroupState?.(group, {
      ...groupState,
      draggedId: undefined,
      draggedOverId: undefined
    })
  }

  const item = (
    <children.type
      {...children.props}
      id={id}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleOnDrop}
      draggable={!disabled}
    />
  )
  if (id === draggedOverId) {
    return (
      <dropTarget.wrapperTag
        data-testid="drop-target"
        key="drop-target"
        onDragOver={handleDragOver}
        onDrop={handleOnDrop}
        id={`${id}_drop`}
      >
        {dropTarget.element}
      </dropTarget.wrapperTag>
    )
  }

  return item
}
