import React from 'react'
import {
  PlotsData,
  PlotsDataKeys,
  PlotsSection,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { Plots } from './Plots'
import { setCollapsed as setCustomPlotsCollapsed } from './customPlots/customPlotsSlice'
import { setCollapsed as setComparisonTableCollapsed } from './comparisonTable/comparisonTableSlice'
import { setCollapsed as setTemplatePlotsCollapsed } from './templatePlots/templatePlotsSlice'
import { initialize } from './webviewSlice'
import { PlotsDispatch } from '../store'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { dispatchAction } from '../../shared/dispatchAction'

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
  dispatchAction('plots', stateUpdate, dispatch)
}

export const App = () => {
  useVsCodeMessaging(feedStore)

  return <Plots />
}
