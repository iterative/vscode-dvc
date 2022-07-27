import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'

export const headersSlice = createSlice({
  initialState: [] as HeaderGroup<Experiment>[],
  name: 'headers',
  reducers: {
    setHeaders: (_, action: PayloadAction<HeaderGroup<Experiment>[]>) => {
      return action.payload || []
    }
  }
})

export const { setHeaders } = headersSlice.actions

export default headersSlice.reducer
