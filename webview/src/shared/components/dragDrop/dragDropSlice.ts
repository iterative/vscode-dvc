import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DragEnterDirection } from './util'

export type DraggedInfo =
  | {
      itemIndex: string
      itemId: string
      group: string
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
  draggedOverGroup: string
  direction: DragEnterDirection | undefined
  draggedOverId: string | undefined
  isHoveringSomething: boolean
}

export const dragDropInitialState: DragDropState = {
  direction: undefined,
  draggedOverGroup: '',
  draggedOverId: undefined,
  draggedRef: undefined,
  groups: {},
  isHoveringSomething: false
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
    setDirection: (
      state,
      action: PayloadAction<DragEnterDirection | undefined>
    ) => {
      return {
        ...state,
        direction: action.payload
      }
    },
    setDraggedOverGroup: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        draggedOverGroup: action.payload
      }
    },
    setDraggedOverId: (state, action: PayloadAction<string | undefined>) => {
      return {
        ...state,
        draggedOverId: action.payload
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
    },
    setIsHoveringSomething: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isHoveringSomething: action.payload
      }
    }
  }
})

export const {
  changeRef,
  setGroup,
  setDraggedOverGroup,
  setDraggedOverId,
  setDirection,
  setIsHoveringSomething
} = dragDropSlice.actions

export default dragDropSlice.reducer
