import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface RibbonState {
  height: number
}

export const ribbonInitialState: RibbonState = {
  height: 0
}

export const ribbonSlice = createSlice({
  initialState: ribbonInitialState,
  name: 'ribbon',
  reducers: {
    update: (_, action: PayloadAction<number>) => {
      return {
        height: action.payload
      }
    }
  }
})

export const { update } = ribbonSlice.actions

export default ribbonSlice.reducer
