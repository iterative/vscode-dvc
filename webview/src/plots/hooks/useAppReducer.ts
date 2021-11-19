import { PlotsData } from 'dvc/src/plots/webview/contract'
import {
  MessageToWebview,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Reducer, useReducer } from 'react'

export enum PlotsSectionKeys {
  LIVE_PLOTS = 'live-plots',
  STATIC_PLOTS = 'static-plots'
}
export type CollapsibleSectionsState = Record<PlotsSectionKeys, boolean>
export const defaultCollapsibleSectionsState = {
  [PlotsSectionKeys.LIVE_PLOTS]: false,
  [PlotsSectionKeys.STATIC_PLOTS]: false
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
      sectionKey: PlotsSectionKeys
    }

const plotsAppReducer: Reducer<PlotsWebviewState, PlotsReducerAction> = (
  state,
  action
) => {
  switch (action.type) {
    case MessageToWebviewType.SET_DATA:
      return {
        ...state,
        data: action.data
      }
    case MessageToWebviewType.SET_DVC_ROOT:
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
