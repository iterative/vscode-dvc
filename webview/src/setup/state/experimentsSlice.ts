import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SetupData } from 'dvc/src/setup/webview/contract'

export type ExperimentsState = Pick<SetupData, 'hasData' | 'needsGitCommit'>

export const experimentsInitialState: ExperimentsState = {
  hasData: undefined,
  needsGitCommit: false
}

export const experimentsSlice = createSlice({
  initialState: experimentsInitialState,
  name: 'experiments',
  reducers: {
    updateHasData: (state, action: PayloadAction<boolean | undefined>) => {
      state.hasData = action.payload
    },
    updateNeedsGitCommit: (state, action: PayloadAction<boolean>) => {
      state.needsGitCommit = action.payload
    }
  }
})

export const { updateHasData, updateNeedsGitCommit } = experimentsSlice.actions

export default experimentsSlice.reducer
