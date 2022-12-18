import React, { DragEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setGroup } from './dragDropSlice'
import { ExperimentsState } from '../../../experiments/store'

export type DragFunction = (e: DragEvent<HTMLElement>) => void

export interface DraggableProps {
  id: string
  group: string
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
  group,
  children,
  disabled,
  onDrop,
  onDragEnter,
  onDragStart,
  onDragEnd,
  onDragLeave
}) => {
  const groupState = useSelector(
    (state: ExperimentsState) => state.dragAndDrop.groups[group] || {}
  )
  const dispatch = useDispatch()
  const { draggedId } = groupState

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
      if (id !== draggedId) {
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
          draggedId: undefined
        },
        id: group
      })
    )
    onDragEnd(e)
  }

  return (
    <children.type
      {...children.props}
      id={id}
      onDragLeave={onDragLeave}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={onDrop}
      draggable={!disabled}
    />
  )
}
