import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SetupData } from 'dvc/src/setup/webview/contract'

export type StudioState = Pick<
  SetupData,
  'shareLiveToStudio' | 'isStudioConnected' | 'studioVerifyUser'
>

export const studioInitialState: StudioState = {
  isStudioConnected: false,
  shareLiveToStudio: false,
  studioVerifyUser: false
}

export const studioSlice = createSlice({
  initialState: studioInitialState,
  name: 'studio',
  reducers: {
    updateIsStudioConnected: (state, action: PayloadAction<boolean>) => {
      state.isStudioConnected = action.payload
    },
    updateShareLiveToStudio: (state, action: PayloadAction<boolean>) => {
      state.shareLiveToStudio = action.payload
    },
    updateStudioVerifyUser: (state, action: PayloadAction<boolean>) => {
      state.studioVerifyUser = action.payload
    }
  }
})

export const {
  updateIsStudioConnected,
  updateShareLiveToStudio,
  updateStudioVerifyUser
} = studioSlice.actions

export default studioSlice.reducer
