import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  SectionCollapsed,
  SetupData
} from 'dvc/src/setup/webview/contract'

export type WebviewState = Pick<SetupData, 'sectionCollapsed'> & {
  hasData: boolean
}

export const webviewInitialState: WebviewState = {
  hasData: false,
  sectionCollapsed: DEFAULT_SECTION_COLLAPSED
}

export const webviewSlice = createSlice({
  initialState: webviewInitialState,
  name: 'webview',
  reducers: {
    updateHasData: state => {
      state.hasData = true
    },
    updateSectionCollapsed: (
      state,
      action: PayloadAction<SectionCollapsed | undefined>
    ) => {
      state.sectionCollapsed = action.payload
    }
  }
})

export const { updateHasData, updateSectionCollapsed } = webviewSlice.actions

export default webviewSlice.reducer
