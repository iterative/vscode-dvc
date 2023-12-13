import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DvcCliDetails, SetupData } from 'dvc/src/setup/webview/contract'

export type DvcState = Omit<
  SetupData,
  | 'hasData'
  | 'isStudioConnected'
  | 'needsGitCommit'
  | 'sectionCollapsed'
  | 'shareLiveToStudio'
  | 'selfHostedStudioUrl'
>

export const dvcInitialState: DvcState = {
  canGitInitialize: false,
  cliCompatible: undefined,
  dvcCliDetails: undefined,
  isAboveLatestTestedVersion: undefined,
  isPythonEnvironmentGlobal: undefined,
  isPythonExtensionInstalled: false,
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
    updateIsAboveLatestTestedVersion: (
      state,
      action: PayloadAction<boolean | undefined>
    ) => {
      state.isAboveLatestTestedVersion = action.payload
    },
    updateIsPythonEnvironmentGlobal: (
      state,
      action: PayloadAction<boolean | undefined>
    ) => {
      state.isPythonEnvironmentGlobal = action.payload
    },
    updateIsPythonExtensionInstalled: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.isPythonExtensionInstalled = action.payload
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
  updateIsAboveLatestTestedVersion,
  updateIsPythonEnvironmentGlobal,
  updateIsPythonExtensionInstalled,
  updateIsPythonExtensionUsed,
  updateNeedsGitInitialized,
  updateProjectInitialized,
  updatePythonBinPath
} = dvcSlice.actions

export default dvcSlice.reducer
