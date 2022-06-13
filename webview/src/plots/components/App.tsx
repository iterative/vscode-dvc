import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  CheckpointPlotsData,
  PlotsComparisonData,
  PlotsData,
  PlotsDataKeys,
  Revision,
  Section,
  SectionCollapsed,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { Plots } from './Plots'
import {
  setCollapsed as setCheckpointPlotsCollapsed,
  update as updateCheckpointPlots
} from './checkpointPlots/checkpointPlotsSlice'
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
  updateHasSelectedPlots,
  updateSelectedRevisions
} from './webviewSlice'
import { AppDispatch } from '../store'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

const dispatchCollapsedSections = (
  sections: SectionCollapsed,
  dispatch: AppDispatch
) => {
  if (sections) {
    dispatch(setCheckpointPlotsCollapsed(sections[Section.CHECKPOINT_PLOTS]))
    dispatch(setComparisonTableCollapsed(sections[Section.COMPARISON_TABLE]))
    dispatch(setTemplatePlotsCollapsed(sections[Section.TEMPLATE_PLOTS]))
  }
}

export const feedStore = (
  data: MessageToWebview<PlotsData>,
  dispatch: AppDispatch
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  if (data.data) {
    dispatch(initialize())
    for (const key of Object.keys(data.data)) {
      switch (key) {
        case PlotsDataKeys.checkpoint:
          dispatch(updateCheckpointPlots(data.data[key] as CheckpointPlotsData))
          continue
        case PlotsDataKeys.comparison:
          dispatch(updateComparisonTable(data.data[key] as PlotsComparisonData))
          continue
        case PlotsDataKeys.template:
          dispatch(updateTemplatePlots(data.data[key] as TemplatePlotsData))
          continue
        case PlotsDataKeys.sectionCollapsed:
          dispatchCollapsedSections(
            data.data[key] as SectionCollapsed,
            dispatch
          )
          continue
        case PlotsDataKeys.hasPlots:
          dispatch(updateHasPlots(!!data.data[key]))
          continue
        case PlotsDataKeys.hasSelectedPlots:
          dispatch(updateHasSelectedPlots(!!data.data[key]))
          continue
        case PlotsDataKeys.selectedRevisions:
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
