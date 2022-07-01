import React, { createContext, useState } from 'react'

export type DraggedInfo =
  | {
      itemIndex: string
      itemId: string
      group?: string
    }
  | undefined

export interface DragDropGroupState {
  draggedId?: string
  draggedOverId?: string
}

export type GroupStates = {
  [group: string]: DragDropGroupState | undefined
}

export type DragDropContextValue = {
  draggedRef: DraggedInfo
  setDraggedRef: ((draggedRef: DraggedInfo) => void) | undefined
  groupStates?: GroupStates
  setGroupState?: (group: string, handlers: DragDropGroupState) => void
  removeGroupState?: (group: string) => void
}

export const DragDropContext = createContext<DragDropContextValue>({
  draggedRef: undefined,
  groupStates: undefined,
  removeGroupState: undefined,
  setDraggedRef: undefined,
  setGroupState: undefined
})

type DragDropProviderProps = {
  children: React.ReactNode
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children
}) => {
  const [draggedRef, setDraggedRef] = useState<DraggedInfo>(undefined)

  const [groupStates, setGroupStates] = useState<GroupStates>({})

  const changeDraggedRef = (d: DraggedInfo) => setDraggedRef(d)

  const setGroupState = (group: string, handlers: DragDropGroupState) => {
    setGroupStates({
      ...groupStates,
      [group]: handlers
    })
  }

  const removeGroupState = (group: string) => {
    setGroupStates({
      ...groupStates,
      [group]: undefined
    })
  }

  return (
    <DragDropContext.Provider
      value={{
        draggedRef,
        groupStates,
        removeGroupState,
        setDraggedRef: changeDraggedRef,
        setGroupState
      }}
    >
      {children}
    </DragDropContext.Provider>
  )
}
