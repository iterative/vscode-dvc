import {
  DEFAULT_SECTION_COLLAPSED,
  CombinedPlotsData,
  Section
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Reducer, useReducer } from 'react'
import { vsCodeApi } from '../../shared/api'
import { sendMessage } from '../../shared/vscode'

export interface PlotsWebviewState {
  data?: CombinedPlotsData
  dvcRoot?: string
}

export enum CollapsibleSectionsActions {
  TOGGLE_COLLAPSED = 'toggleCollapsed'
}

export type PlotsReducerAction =
  | MessageToWebview<CombinedPlotsData>
  | {
      type: CollapsibleSectionsActions.TOGGLE_COLLAPSED
      sectionKey: Section
    }

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

    case CollapsibleSectionsActions.TOGGLE_COLLAPSED:
      sendMessage({
        payload: {
          [action.sectionKey]:
            !state.data?.sectionCollapsed?.[action.sectionKey]
        },
        type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
      })
      return {
        ...state,
        data: {
          ...state.data,
          sectionCollapsed: {
            ...(state.data?.sectionCollapsed || DEFAULT_SECTION_COLLAPSED),
            [action.sectionKey]:
              !state.data?.sectionCollapsed?.[action.sectionKey]
          }
        }
      }

    default:
      return state
  }
}

export const useAppReducer = (testData?: PlotsWebviewState) =>
  useReducer(plotsAppReducer, testData || {})
