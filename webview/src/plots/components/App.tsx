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
import { PlotsDispatch } from '../store'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

const dispatchCollapsedSections = (
  sections: SectionCollapsed,
  dispatch: PlotsDispatch
) => {
  if (sections) {
    dispatch(setCheckpointPlotsCollapsed(sections[Section.CHECKPOINT_PLOTS]))
    dispatch(setComparisonTableCollapsed(sections[Section.COMPARISON_TABLE]))
    dispatch(setTemplatePlotsCollapsed(sections[Section.TEMPLATE_PLOTS]))
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
        case PlotsDataKeys.CHECKPOINT:
          dispatch(updateCheckpointPlots(data.data[key] as CheckpointPlotsData))
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
        case PlotsDataKeys.HAS_SELECTED_PLOTS:
          dispatch(updateHasSelectedPlots(!!data.data[key]))
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
