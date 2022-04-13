import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Reducer, useReducer } from 'react'

export interface PlotsWebviewState {
  data?: PlotsData
  dvcRoot?: string
}

export type PlotsReducerAction = MessageToWebview<PlotsData>

const plotsAppReducer: Reducer<PlotsWebviewState, PlotsReducerAction> = (
  state,
  action
) => {
  if (action.type === MessageToWebviewType.SET_DATA) {
    return {
      ...state,
      data: { ...state.data, ...action.data }
    }
  }

  return state
}

export const useAppReducer = (testData?: PlotsWebviewState) =>
  useReducer(plotsAppReducer, testData || {})
