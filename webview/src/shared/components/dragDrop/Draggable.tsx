import React, { DragEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setGroup } from './dragDropSlice'
import { DropTarget } from './DropTarget'
import { ExperimentsState } from '../../../experiments/store'

export type DragFunction = (e: DragEvent<HTMLElement>) => void

export interface DraggableProps {
  id: string
  group: string
  disabled: boolean
  children: JSX.Element
  dropTarget: JSX.Element
  onDrop: DragFunction
  onDragStart: DragFunction
  onDragEnter: DragFunction
  onDragEnd: DragFunction
}

export const Draggable: React.FC<DraggableProps> = ({
  id,
  group,
  children,
  disabled,
  dropTarget,
  onDrop,
  onDragEnter,
  onDragStart,
  onDragEnd
}) => {
  const groupState = useSelector(
    (state: ExperimentsState) => state.dragAndDrop.groups[group] || {}
  )
  const dispatch = useDispatch()
  const { draggedOverId, draggedId } = groupState

  const modifyGroup = (id: string) => {
    dispatch(
      setGroup({
        group: {
          ...groupState,
          draggedId: id
        },
        id: group
      })
    )
  }

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.setData('itemId', id)
    e.dataTransfer.setData('group', group)
    modifyGroup(id)
    onDragStart(e)
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    if (draggedId) {
      const { id } = e.currentTarget

      if (id !== draggedId && id !== draggedOverId) {
        modifyGroup(id)
        onDragEnter(e)
      }
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const handleDragEnd = (e: DragEvent<HTMLElement>) => {
    dispatch(
      setGroup({
        group: {
          ...groupState,
          draggedId: undefined,
          draggedOverId: undefined
        },
        id: group
      })
    )
    onDragEnd(e)
  }

  if (dropTarget && id === draggedOverId) {
    return (
      <DropTarget
        onDragOver={handleDragOver}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
        id={id}
        key="drop-target"
      >
        {dropTarget}
      </DropTarget>
    )
  }

  return (
    <children.type
      {...children.props}
      id={id}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={onDrop}
      draggable={!disabled}
    />
  )
}
