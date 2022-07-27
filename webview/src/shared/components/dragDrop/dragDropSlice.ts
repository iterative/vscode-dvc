import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
export interface DragDropState {
  draggedRef: DraggedInfo
  groups: GroupStates
}

export const dragDropInitialState: DragDropState = {
  draggedRef: undefined,
  groups: {}
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
    },
    setGroup: (
      state,
      action: PayloadAction<{ id: string; group: DragDropGroupState }>
    ) => {
      return {
        ...state,
        groups: { ...state.groups, [action.payload.id]: action.payload.group }
      }
    }
  }
})

export const { changeRef, setGroup } = dragDropSlice.actions

export default dragDropSlice.reducer
