import React, { DragEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DropTargetInfo, makeTarget } from './DragDropContainer'
import { setGroupState } from './dragDropSlice'
import { ExperimentsRootState } from '../../../experiments/store'

export type OnDrop = (draggedId: string, draggedOverId: string) => void
export type OnDragStart = (draggedId: string) => void
export type OnDragOver = (draggedId: string, draggedOverId: string) => void

export interface DraggableProps {
  id: string
  group: string
  disabled: boolean
  dropTarget: DropTargetInfo
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
  const { groupStates } = useSelector(
    (state: ExperimentsRootState) => state.dragAndDrop
  )
  const dispatch = useDispatch()

  const groupState = groupStates?.[group] || {}
  const { draggedOverId, draggedId } = groupState

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    const { id } = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    dispatch(
      setGroupState({
        group,
        handlers: {
          ...groupState,
          draggedId: id
        }
      })
    )
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
    !disabled &&
      draggedId &&
      id !== draggedId &&
      id !== draggedOverId &&
      (dispatch(
        setGroupState({
          group,
          handlers: {
            ...groupState,
            draggedOverId: id
          }
        })
      ) ||
        onDragOver?.(draggedId, id))
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
    dispatch(
      setGroupState({
        group,
        handlers: {
          ...groupState,
          draggedId: undefined,
          draggedOverId: undefined
        }
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
