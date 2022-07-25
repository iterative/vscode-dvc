import React, { DragEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeTarget } from './DragDropContainer'
import { setGroup } from './dragDropSlice'
import { ExperimentsState } from '../../../experiments/store'

export type OnDrop = (draggedId: string, draggedOverId: string) => void
export type OnDragStart = (draggedId: string) => void
export type OnDragOver = (draggedId: string, draggedOverId: string) => void

export interface DraggableProps {
  id: string
  group: string
  disabled: boolean
  dropTarget: JSX.Element
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const groupStates = useSelector(
    (state: ExperimentsState) => state.dragAndDrop.groups
  )
  const dispatch = useDispatch()

  const groupState = groupStates[group] || {}
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
    modifyGroup(id)
    onDragStart?.(id)
  }

  const handleOnDrop = () => {
    !disabled &&
      draggedId &&
      draggedOverId &&
      onDrop?.(draggedId, draggedOverId)
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    if (!disabled && draggedId) {
      const { id } = e.currentTarget

      if (id !== draggedId && id !== draggedOverId) {
        modifyGroup(id)
        onDragOver?.(draggedId, id)
      }
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
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
    return makeTarget(dropTarget, handleDragOver, handleOnDrop, id)
  }

  return item
}
