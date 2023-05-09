import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_SECTION_COLLAPSED,
  SectionCollapsed,
  SetupData
} from 'dvc/src/setup/webview/contract'

export interface SetupDataState extends SetupData {
  hasReceivedMessageFromVsCode: boolean
}

export const setupDataInitialState: SetupDataState = {
  canGitInitialize: false,
  cliCompatible: undefined,
  dvcCliDetails: undefined,
  hasData: undefined,
  hasReceivedMessageFromVsCode: false,
  isPythonExtensionUsed: false,
  isStudioConnected: false,
  needsGitCommit: false,
  needsGitInitialized: false,
  projectInitialized: false,
  pythonBinPath: undefined,
  sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
  shareLiveToStudio: false
}

export const tableDataSlice = createSlice({
  initialState: setupDataInitialState,
  name: 'setupData',
  reducers: {
    update: (_, action: PayloadAction<SetupData>) => {
      return { ...action.payload, hasReceivedMessageFromVsCode: true }
    },
    updateSectionCollapsed: (
      state,
      action: PayloadAction<SectionCollapsed>
    ) => {
      state.sectionCollapsed = action.payload
    },
    updateShareLiveToStudio: (state, action: PayloadAction<boolean>) => {
      state.shareLiveToStudio = action.payload
    }
  }
})

export const { update, updateSectionCollapsed, updateShareLiveToStudio } =
  tableDataSlice.actions

export default tableDataSlice.reducer
