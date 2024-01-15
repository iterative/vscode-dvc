import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  PlotsData,
  PlotsDataKeys,
  PlotsSection,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { Plots } from './Plots'
import {
  setCollapsed as setCustomPlotsCollapsed,
  update as updateCustomPlots
} from './customPlots/customPlotsSlice'
import {
  setCollapsed as setComparisonTableCollapsed,
  updateShouldShowTooManyPlotsMessage as updateShouldShowTooManyImagesMessage,
  update as updateComparisonTable
} from './comparisonTable/comparisonTableSlice'
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

export const feedStore = (
  data: MessageToWebview<PlotsData>,
  dispatch: PlotsDispatch
) => {
  if (!data?.data) {
    return
  }
  dispatch(initialize())

  const keys = Object.keys(data.data) as PlotsDataKeys[]
  for (const key of keys) {
    if (key === PlotsDataKeys.SECTION_COLLAPSED) {
      dispatchCollapsedSections(
        data.data[PlotsDataKeys.SECTION_COLLAPSED] as SectionCollapsed,
        dispatch
      )
      continue
    }

    const action = actionToDispatch[key as keyof typeof actionToDispatch]
    const value = data.data[key]
    if (!action) {
      continue
    }
    dispatch(action(value as never))
  }
}

export const App = () => {
  const dispatch = useDispatch()

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<PlotsData> }) => {
        feedStore(data, dispatch)
      },
      [dispatch]
    )
  )

  return <Plots />
}
