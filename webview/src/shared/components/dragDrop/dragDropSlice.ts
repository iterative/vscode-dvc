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
export interface DragDropState {
  draggedRef: DraggedInfo
}

export const dragDropInitialState: DragDropState = {
  draggedRef: undefined
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
    }
  }
})

export const { changeRef } = dragDropSlice.actions

export default dragDropSlice.reducer
