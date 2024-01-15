import {
  PlotsData,
  PlotsDataKeys,
  PlotsSection,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import React from 'react'
import { Plots } from './Plots'
import {
  setCollapsed as setComparisonTableCollapsed,
  update as updateComparisonTable,
  updateShouldShowTooManyPlotsMessage as updateShouldShowTooManyImagesMessage
} from './comparisonTable/comparisonTableSlice'
import {
  setCollapsed as setCustomPlotsCollapsed,
  update as updateCustomPlots
} from './customPlots/customPlotsSlice'
import {
  setCollapsed as setTemplatePlotsCollapsed,
  updateShouldShowTooManyPlotsMessage as updateShouldShowTooManyTemplatesMessage,
  update as updateTemplatePlots
} from './templatePlots/templatePlotsSlice'
import {
  initialize,
  updateCliError,
  updateHasPlots,
  updateHasUnselectedPlots,
  updatePlotErrors,
  updateSelectedRevisions
} from './webviewSlice'
import { PlotsDispatch } from '../store'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { dispatchActions } from '../../shared/dispatchActions'

const dispatchCollapsedSections = (
  sections: SectionCollapsed,
  dispatch: PlotsDispatch
) => {
  if (sections) {
    dispatch(setCustomPlotsCollapsed(sections[PlotsSection.CUSTOM_PLOTS]))
    dispatch(
      setComparisonTableCollapsed(sections[PlotsSection.COMPARISON_TABLE])
    )
    dispatch(setTemplatePlotsCollapsed(sections[PlotsSection.TEMPLATE_PLOTS]))
  }
}

const actionToDispatch = {
  [PlotsDataKeys.CLI_ERROR]: updateCliError,
  [PlotsDataKeys.CUSTOM]: updateCustomPlots,
  [PlotsDataKeys.COMPARISON]: updateComparisonTable,
  [PlotsDataKeys.TEMPLATE]: updateTemplatePlots,
  [PlotsDataKeys.HAS_PLOTS]: updateHasPlots,
  [PlotsDataKeys.HAS_UNSELECTED_PLOTS]: updateHasUnselectedPlots,
  [PlotsDataKeys.PLOT_ERRORS]: updatePlotErrors,
  [PlotsDataKeys.SELECTED_REVISIONS]: updateSelectedRevisions,
  [PlotsDataKeys.SHOW_TOO_MANY_TEMPLATE_PLOTS]:
    updateShouldShowTooManyTemplatesMessage,
  [PlotsDataKeys.SHOW_TOO_MANY_COMPARISON_IMAGES]:
    updateShouldShowTooManyImagesMessage
} as const

export type PlotsActions = typeof actionToDispatch

export const feedStore = (
  data: MessageToWebview<PlotsData>,
  dispatch: PlotsDispatch
) => {
  const stateUpdate = data?.data
  if (!stateUpdate) {
    return
  }
  dispatch(initialize())

  const keys = Object.keys(stateUpdate) as PlotsDataKeys[]
  if (keys.includes(PlotsDataKeys.SECTION_COLLAPSED)) {
    dispatchCollapsedSections(
      stateUpdate[PlotsDataKeys.SECTION_COLLAPSED] as SectionCollapsed,
      dispatch
    )
  }
  dispatchActions(actionToDispatch, stateUpdate, dispatch)
}

export const App = () => {
  useVsCodeMessaging(feedStore)

  return <Plots />
}
