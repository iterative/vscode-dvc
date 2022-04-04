import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Reducer, useReducer } from 'react'
import { vsCodeApi } from '../../shared/api'

export interface PlotsWebviewState {
  data?: PlotsData
  dvcRoot?: string
}

export type PlotsReducerAction = MessageToWebview<PlotsData>

const plotsAppReducer: Reducer<PlotsWebviewState, PlotsReducerAction> = (
  state,
  action
) => {
  switch (action.type) {
    case MessageToWebviewType.SET_DATA:
      return {
        ...state,
        data: { ...state.data, ...action.data }
      }

    case MessageToWebviewType.SET_DVC_ROOT:
      vsCodeApi.setState({ dvcRoot: action.dvcRoot })
      return state

    default:
      return state
  }
}

export const useAppReducer = (testData?: PlotsWebviewState) =>
  useReducer(plotsAppReducer, testData || {})
