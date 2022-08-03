import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const focusedColumnSlice = createSlice({
  initialState: '',
  name: 'focusedColumnId',
  reducers: {
    changeFocusedColumnId: (_, action: PayloadAction<string>) => {
      return action.payload
    }
  }
})

export const { changeFocusedColumnId } = focusedColumnSlice.actions

export default focusedColumnSlice.reducer
