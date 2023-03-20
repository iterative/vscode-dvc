import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  CustomPlotsData,
  PlotsComparisonData,
  PlotsData,
  PlotsDataKeys,
  Revision,
  PlotsSection,
  SectionCollapsed,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { Plots } from './Plots'
import {
  setCollapsed as setCustomPlotsCollapsed,
  update as updateCustomPlots
} from './customPlots/customPlotsSlice'
import {
  setCollapsed as setComparisonTableCollapsed,
  update as updateComparisonTable
} from './comparisonTable/comparisonTableSlice'
import {
  setCollapsed as setTemplatePlotsCollapsed,
  update as updateTemplatePlots
} from './templatePlots/templatePlotsSlice'
import {
  initialize,
  updateHasPlots,
  updateHasUnselectedPlots,
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

export const feedStore = (
  data: MessageToWebview<PlotsData>,
  dispatch: PlotsDispatch
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  if (data.data) {
    dispatch(initialize())
    for (const key of Object.keys(data.data)) {
      switch (key) {
        case PlotsDataKeys.CUSTOM:
          dispatch(updateCustomPlots(data.data[key] as CustomPlotsData))
          continue
        case PlotsDataKeys.COMPARISON:
          dispatch(updateComparisonTable(data.data[key] as PlotsComparisonData))
          continue
        case PlotsDataKeys.TEMPLATE:
          dispatch(updateTemplatePlots(data.data[key] as TemplatePlotsData))
          continue
        case PlotsDataKeys.SECTION_COLLAPSED:
          dispatchCollapsedSections(
            data.data[key] as SectionCollapsed,
            dispatch
          )
          continue
        case PlotsDataKeys.HAS_PLOTS:
          dispatch(updateHasPlots(!!data.data[key]))
          continue
        case PlotsDataKeys.HAS_UNSELECTED_PLOTS:
          dispatch(updateHasUnselectedPlots(!!data.data[key]))
          continue
        case PlotsDataKeys.SELECTED_REVISIONS:
          dispatch(updateSelectedRevisions(data.data[key] as Revision[]))
          continue
        default:
          continue
      }
    }
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
