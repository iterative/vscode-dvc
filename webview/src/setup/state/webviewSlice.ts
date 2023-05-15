import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  SectionCollapsed,
  SetupSection
} from 'dvc/src/setup/webview/contract'

export type WebviewState = {
  hasData: boolean
  sectionCollapsed: SectionCollapsed
}

export const webviewInitialState: WebviewState = {
  hasData: false,
  sectionCollapsed: DEFAULT_SECTION_COLLAPSED
}

export const webviewSlice = createSlice({
  initialState: webviewInitialState,
  name: 'webview',
  reducers: {
    toggleSectionCollapsed: (state, action: PayloadAction<SetupSection>) => {
      const section = action.payload
      state.sectionCollapsed = {
        ...state.sectionCollapsed,
        [section]: !state.sectionCollapsed[section]
      }
    },
    updateHasData: state => {
      state.hasData = true
    },
    updateSectionCollapsed: (
      state,
      action: PayloadAction<SectionCollapsed | undefined>
    ) => {
      if (action.payload) {
        state.sectionCollapsed = action.payload
      }
    }
  }
})

export const { updateHasData, updateSectionCollapsed, toggleSectionCollapsed } =
  webviewSlice.actions

export default webviewSlice.reducer
