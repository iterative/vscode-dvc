import {
  defaultCollapsedSections,
  PlotsData,
  Section
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Reducer, useReducer } from 'react'
import { vsCodeApi } from '../../shared/api'

export interface PlotsWebviewState {
  data?: PlotsData
  dvcRoot?: string
}

export enum CollapsibleSectionsActions {
  TOGGLE_COLLAPSED = 'toggleCollapsed'
}

export type PlotsReducerAction =
  | MessageToWebview<PlotsData>
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
      vsCodeApi.postMessage({
        payload: {
          [action.sectionKey]:
            !state.data?.collapsedSections?.[action.sectionKey]
        },
        type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
      })
      return {
        ...state,
        data: {
          ...state.data,
          collapsedSections: {
            ...(state.data?.collapsedSections || defaultCollapsedSections),
            [action.sectionKey]:
              !state.data?.collapsedSections?.[action.sectionKey]
          }
        }
      }

    default:
      return state
  }
}

export const useAppReducer = (testData?: PlotsWebviewState) =>
  useReducer(plotsAppReducer, testData || {})
