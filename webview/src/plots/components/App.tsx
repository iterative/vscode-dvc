import React, { useCallback } from 'react'
import {
  PlotsData,
  PlotsDataKeys,
  Section,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { Plots } from './Plots'
import { useDispatch } from 'react-redux'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
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
  updateHasSelectedRevisions
} from './webviewSlice'
import { AppDispatch } from '../store'

export const feedStore = (
  data: MessageToWebview<PlotsData>,
  dispatch: AppDispatch
) => {
  if (data.data) {
    dispatch(initialize())
    for (const key of Object.keys(data.data)) {
      switch (key) {
        case PlotsDataKeys.checkpoint:
          dispatch(updateCheckpointPlots(data.data[key]!))
          continue
        case PlotsDataKeys.comparison:
          dispatch(updateComparisonTable(data.data[key]!))
          continue
        case PlotsDataKeys.template:
          dispatch(updateTemplatePlots(data.data[key]!))
          continue
        case PlotsDataKeys.sectionCollapsed:
          const sections = data.data[key] as SectionCollapsed
          if (sections) {
            dispatch(
              setCheckpointPlotsCollapsed(sections[Section.CHECKPOINT_PLOTS])
            )
            dispatch(
              setComparisonTableCollapsed(sections[Section.COMPARISON_TABLE])
            )
            dispatch(
              setTemplatePlotsCollapsed(sections[Section.TEMPLATE_PLOTS])
            )
          }
          continue
        case PlotsDataKeys.hasPlots:
          dispatch(updateHasPlots(data.data[key]!))
          continue
        case PlotsDataKeys.hasSelectedPlots:
          dispatch(updateHasSelectedPlots(data.data[key]!))
          continue
        case PlotsDataKeys.hasSelectedRevisions:
          dispatch(updateHasSelectedRevisions(data.data[key]!))
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
