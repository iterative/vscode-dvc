import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const headerDropTargetSlice = createSlice({
  initialState: '',
  name: 'headerDropTarget',
  reducers: {
    setDropTarget: (_, action: PayloadAction<string>) => {
      return action.payload || ''
    }
  }
})

export const { setDropTarget } = headerDropTargetSlice.actions

export default headerDropTargetSlice.reducer
