import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type DraggedInfo =
  | {
      itemIndex: string
      itemId: string
      group?: string
    }
  | undefined
export interface DragDropState {
  draggedRef: DraggedInfo
}

export const dragDropInitialState: DragDropState = {
  draggedRef: undefined
}

export const dragDropSlice = createSlice({
  initialState: dragDropInitialState,
  name: 'dragAndDrop',
  reducers: {
    changeRef: (state, action: PayloadAction<DraggedInfo>) => {
      return {
        ...state,
        draggedRef: action.payload
      }
    }
  }
})

export const { changeRef } = dragDropSlice.actions

export default dragDropSlice.reducer
