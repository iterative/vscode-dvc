import { Dispatch, createSelector } from '@reduxjs/toolkit'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import {
  DECODE_METRIC_PARAM_REGEX,
  FILE_SPLIT_REGEX,
  METRIC_PARAM_SEPARATOR
} from 'dvc/src/experiments/columns/constants'
import {
  clearState as clearTemplateState,
  toggleDragAndDropMode as toggleTemplateDragAndDrop
} from './templatePlots/templatePlotsSlice'
import {
  clearState as clearCustomState,
  toggleDragAndDropMode as toggleCustomDragAndDrop
} from './customPlots/customPlotsSlice'
import {
  clearState as clearComparisonState,
  toggleDragAndDropMode as toggleComparisonDragAndDrop
} from './comparisonTable/comparisonTableSlice'
import { PlotsState } from '../store'

export const shouldUseVirtualizedGrid = (
  nbItems: number,
  nbItemsPerRow: number
) => nbItems / nbItemsPerRow > 8 - (nbItemsPerRow - 1)

const isDragAndDropModeTemplate = (state: PlotsState) =>
  state.template.isInDragAndDropMode
const isDragAndDropModeCustom = (state: PlotsState) =>
  state.custom.isInDragAndDropMode

export const isDragAndDropModeSelector = createSelector(
  [
    isDragAndDropModeTemplate,
    isDragAndDropModeCustom,
    (_, sectionKey: PlotsSection) => sectionKey
  ],
  (templatePlotsDragAndDropMode, customPlotsDragAndDropMode, sectionKey) => {
    switch (sectionKey) {
      case PlotsSection.TEMPLATE_PLOTS:
        return templatePlotsDragAndDropMode
      case PlotsSection.CUSTOM_PLOTS:
        return customPlotsDragAndDropMode
      default:
        return false
    }
  }
)

export const clearStateActions = {
  [PlotsSection.TEMPLATE_PLOTS]: clearTemplateState,
  [PlotsSection.CUSTOM_PLOTS]: clearCustomState,
  [PlotsSection.COMPARISON_TABLE]: clearComparisonState
}

const toggleDragAndDropModeActions = {
  [PlotsSection.TEMPLATE_PLOTS]: toggleTemplateDragAndDrop,
  [PlotsSection.CUSTOM_PLOTS]: toggleCustomDragAndDrop,
  [PlotsSection.COMPARISON_TABLE]: toggleComparisonDragAndDrop
}

export const changeDragAndDropMode = (
  sectionKey: PlotsSection,
  dispatch: Dispatch,
  isDragAndDropMode: boolean
) => dispatch(toggleDragAndDropModeActions[sectionKey](!isDragAndDropMode))

const cleanTitlePart = (title: string) => {
  const regexResult = FILE_SPLIT_REGEX.exec(title)
  if (!regexResult) {
    return title
  }

  return (
    regexResult[2]
      ?.replace(/_\d+$/g, '')
      .split(METRIC_PARAM_SEPARATOR)
      .map(part =>
        part.replace(DECODE_METRIC_PARAM_REGEX, METRIC_PARAM_SEPARATOR)
      )
      .pop() || title
  )
}
export const getMetricVsParamTitle = (metric: string, param: string) =>
  `${cleanTitlePart(metric)} vs. ${cleanTitlePart(param)}`
