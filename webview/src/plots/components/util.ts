import { Dispatch, createSelector } from '@reduxjs/toolkit'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import {
  DECODE_METRIC_PARAM_REGEX,
  FILE_SPLIT_REGEX,
  METRIC_PARAM_SEPARATOR
} from 'dvc/src/experiments/columns/constants'
import { toggleDragAndDropMode as toggleTemplateDragAndDrop } from './templatePlots/templatePlotsSlice'
import { toggleDragAndDropMode as toggleCustomDragAndDrop } from './customPlots/customPlotsSlice'
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

export const changeDragAndDropMode = (
  sectionKey: PlotsSection,
  dispatch: Dispatch,
  isDragAndDropMode: boolean
) => {
  const toggleMode =
    sectionKey === PlotsSection.TEMPLATE_PLOTS
      ? toggleTemplateDragAndDrop
      : toggleCustomDragAndDrop
  return dispatch(toggleMode(!isDragAndDropMode))
}

const cleanTitlePart = (title: string) => {
  const regexResult = FILE_SPLIT_REGEX.exec(title)
  if (!regexResult) {
    return title
  }
  const fileSegment = regexResult[2]

  return (
    fileSegment
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
