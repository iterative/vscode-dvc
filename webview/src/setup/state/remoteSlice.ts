import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SetupData } from 'dvc/src/setup/webview/contract'

export type RemoteState = Pick<SetupData, 'remoteList'>

export const remoteInitialState: RemoteState = {
  remoteList: undefined
}

export const remoteSlice = createSlice({
  initialState: remoteInitialState,
  name: 'studio',
  reducers: {
    updateRemoteList: (
      state,
      action: PayloadAction<{ [alias: string]: string } | undefined>
    ) => {
      state.remoteList = action.payload
    }
  }
})

export const { updateRemoteList } = remoteSlice.actions

export default remoteSlice.reducer
