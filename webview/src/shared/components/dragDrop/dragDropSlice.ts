import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { clearData } from '../../actions'
import { ReducerName } from '../../constants'

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
  groupStates?: GroupStates
}

export const dragDropInitialState: DragDropState = {
  draggedRef: undefined,
  groupStates: undefined
}

export const dragDropSlice = createSlice({
  extraReducers: builder => {
    builder.addCase(clearData, (_, action) => {
      if (!action.payload || action.payload === ReducerName.DRAG_AND_DROP) {
        return dragDropInitialState
      }
    })
  },
  initialState: dragDropInitialState,
  name: ReducerName.DRAG_AND_DROP,
  reducers: {
    changeRef: (state, action: PayloadAction<DraggedInfo>) => {
      return {
        ...state,
        draggedRef: action.payload
      }
    },
    setGroupState: (
      state,
      action: PayloadAction<{ group: string; handlers: DragDropGroupState }>
    ) => {
      const { group, handlers } = action.payload
      return {
        ...state,
        groupStates: {
          ...state.groupStates,
          [group]: handlers
        }
      }
    }
  }
})

export const { changeRef, setGroupState } = dragDropSlice.actions

export default dragDropSlice.reducer
