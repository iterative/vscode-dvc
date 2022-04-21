import React, { createContext, useState } from 'react'

export type DraggedInfo =
  | {
      itemIndex: string
      itemId: string
      group: string
    }
  | undefined

export type DragDropContextValue = {
  draggedRef: DraggedInfo
  setDraggedRef: ((draggedRef: DraggedInfo) => void) | undefined
}

export const DragDropContext = createContext<DragDropContextValue>({
  draggedRef: undefined,
  setDraggedRef: undefined
})

export const DragDropProvider: React.FC = ({ children }) => {
  const [draggedRef, setDraggedRef] = useState<DraggedInfo>(undefined)

  const changeDraggedRef = (d: DraggedInfo) => setDraggedRef(d)

  return (
    <DragDropContext.Provider
      value={{ draggedRef, setDraggedRef: changeDraggedRef }}
    >
      {children}
    </DragDropContext.Provider>
  )
}
