import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DvcCliDetails, SetupData } from 'dvc/src/setup/webview/contract'

export type DvcState = Omit<
  SetupData,
  | 'hasData'
  | 'isStudioConnected'
  | 'needsGitCommit'
  | 'sectionCollapsed'
  | 'shareLiveToStudio'
>

export const dvcInitialState: DvcState = {
  canGitInitialize: false,
  cliCompatible: undefined,
  dvcCliDetails: undefined,
  isPythonExtensionUsed: false,
  needsGitInitialized: false,
  projectInitialized: false,
  pythonBinPath: undefined,
  remoteList: undefined
}

export const dvcSlice = createSlice({
  initialState: dvcInitialState,
  name: 'dvc',
  reducers: {
    updateCanGitInitialize: (state, action: PayloadAction<boolean>) => {
      state.canGitInitialize = action.payload
    },
    updateCliCompatible: (
      state,
      action: PayloadAction<boolean | undefined>
    ) => {
      state.cliCompatible = action.payload
    },
    updateDvcCliDetails: (
      state,
      action: PayloadAction<DvcCliDetails | undefined>
    ) => {
      state.dvcCliDetails = action.payload
    },
    updateIsPythonExtensionUsed: (state, action: PayloadAction<boolean>) => {
      state.isPythonExtensionUsed = action.payload
    },
    updateNeedsGitInitialized: (
      state,
      action: PayloadAction<boolean | undefined>
    ) => {
      state.needsGitInitialized = action.payload
    },
    updateProjectInitialized: (state, action: PayloadAction<boolean>) => {
      state.projectInitialized = action.payload
    },
    updatePythonBinPath: (state, action: PayloadAction<string | undefined>) => {
      state.pythonBinPath = action.payload
    }
  }
})

export const {
  updateCanGitInitialize,
  updateCliCompatible,
  updateDvcCliDetails,
  updateIsPythonExtensionUsed,
  updateNeedsGitInitialized,
  updateProjectInitialized,
  updatePythonBinPath
} = dvcSlice.actions

export default dvcSlice.reducer
