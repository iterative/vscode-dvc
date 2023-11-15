import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SetupData } from 'dvc/src/setup/webview/contract'

export type StudioState = Pick<
  SetupData,
  'shareLiveToStudio' | 'isStudioConnected' | 'isStudioConnecting'
>

export const studioInitialState: StudioState = {
  isStudioConnected: false,
  isStudioConnecting: false,
  shareLiveToStudio: false
}

export const studioSlice = createSlice({
  initialState: studioInitialState,
  name: 'studio',
  reducers: {
    updateIsStudioConnected: (state, action: PayloadAction<boolean>) => {
      state.isStudioConnected = action.payload
    },
    updateIsStudioConnecting: (state, action: PayloadAction<boolean>) => {
      state.isStudioConnecting = action.payload
    },
    updateShareLiveToStudio: (state, action: PayloadAction<boolean>) => {
      state.shareLiveToStudio = action.payload
    }
  }
})

export const {
  updateIsStudioConnected,
  updateIsStudioConnecting,
  updateShareLiveToStudio
} = studioSlice.actions

export default studioSlice.reducer
