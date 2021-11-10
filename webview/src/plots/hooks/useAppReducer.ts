import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Reducer, useReducer } from 'react'

export enum CollapsibleSectionsKeys {
  LIVE_PLOTS,
  STATIC_PLOTS
}
export type CollapsibleSectionsState = Record<CollapsibleSectionsKeys, boolean>
export const defaultCollapsibleSectionsState = {
  [CollapsibleSectionsKeys.LIVE_PLOTS]: false,
  [CollapsibleSectionsKeys.STATIC_PLOTS]: false
}

export interface PlotsWebviewState {
  data?: PlotsData
  dvcRoot?: string
  collapsedSections: CollapsibleSectionsState
}

export enum CollapsibleSectionsActions {
  TOGGLE_COLLAPSED = 'toggleCollapsed'
}

export type PlotsReducerAction =
  | MessageToWebview<PlotsData>
  | {
      type: CollapsibleSectionsActions.TOGGLE_COLLAPSED
      sectionKey: CollapsibleSectionsKeys
    }

const plotsAppReducer: Reducer<PlotsWebviewState, PlotsReducerAction> = (
  state,
  action
) => {
  switch (action.type) {
    case MessageToWebviewType.setData:
      return {
        ...state,
        data: action.data
      }
    case MessageToWebviewType.setDvcRoot:
      return {
        ...state,
        dvcRoot: action.dvcRoot
      }
    case CollapsibleSectionsActions.TOGGLE_COLLAPSED:
      return {
        ...state,
        collapsedSections: {
          ...state.collapsedSections,
          [action.sectionKey]: !state.collapsedSections[action.sectionKey]
        }
      }
    default:
      return state
  }
}

const defaultAppState: PlotsWebviewState = {
  collapsedSections: defaultCollapsibleSectionsState
}

export const useAppReducer = (initialState?: PlotsWebviewState) =>
  useReducer(plotsAppReducer, initialState || defaultAppState)
