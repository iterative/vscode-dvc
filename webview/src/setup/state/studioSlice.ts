import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SetupData } from 'dvc/src/setup/webview/contract'

export type StudioState = Pick<
  SetupData,
  'shareLiveToStudio' | 'isStudioConnected' | 'selfHostedStudioUrl'
>

export const studioInitialState: StudioState = {
  isStudioConnected: false,
  selfHostedStudioUrl: null,
  shareLiveToStudio: false
}

export const studioSlice = createSlice({
  initialState: studioInitialState,
  name: 'studio',
  reducers: {
    updateIsStudioConnected: (state, action: PayloadAction<boolean>) => {
      state.isStudioConnected = action.payload
    },
    updateSelfHostedStudioUrl: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selfHostedStudioUrl = action.payload
    },
    updateShareLiveToStudio: (state, action: PayloadAction<boolean>) => {
      state.shareLiveToStudio = action.payload
    }
  }
})

export const {
  updateIsStudioConnected,
  updateShareLiveToStudio,
  updateSelfHostedStudioUrl
} = studioSlice.actions

export default studioSlice.reducer
