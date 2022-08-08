import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BorderIds {
  rightColumnBorderId: string
  leftColumnBorderId: string
}

export interface FocusedColumnState extends BorderIds {
  isColumnResizing: boolean
}

export const initialBorderIds: BorderIds = {
  leftColumnBorderId: '',
  rightColumnBorderId: ''
}

export const initalFocusedColumnState: FocusedColumnState = {
  ...initialBorderIds,
  isColumnResizing: false
}

export const focusedColumnSlice = createSlice({
  initialState: initalFocusedColumnState,
  name: 'focusedColumn',
  reducers: {
    changeFocusedColumnIds: (state, action: PayloadAction<BorderIds>) => {
      return state.isColumnResizing
        ? state
        : {
            ...state,
            leftColumnBorderId: action.payload.leftColumnBorderId,
            rightColumnBorderId: action.payload.rightColumnBorderId
          }
    },
    changeIsColumnResizing: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isColumnResizing: action.payload
      }
    }
  }
})

export const { changeFocusedColumnIds, changeIsColumnResizing } =
  focusedColumnSlice.actions

export default focusedColumnSlice.reducer
