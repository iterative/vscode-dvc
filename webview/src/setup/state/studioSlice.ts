import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SetupData } from 'dvc/src/setup/webview/contract'

export type StudioState = Pick<
  SetupData,
  'shareLiveToStudio' | 'isStudioConnected' | 'studioVerifyUserCode'
>

export const studioInitialState: StudioState = {
  isStudioConnected: false,
  shareLiveToStudio: false,
  studioVerifyUserCode: null
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
    updateStudioUserCode: (state, action: PayloadAction<string | null>) => {
      state.studioVerifyUserCode = action.payload
    }
  }
})

export const {
  updateIsStudioConnected,
  updateShareLiveToStudio,
  updateStudioUserCode
} = studioSlice.actions

export default studioSlice.reducer
