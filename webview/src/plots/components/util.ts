import { Dispatch, createSelector } from '@reduxjs/toolkit'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
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
  switch (sectionKey) {
    case PlotsSection.TEMPLATE_PLOTS:
      return dispatch(toggleTemplateDragAndDrop(!isDragAndDropMode))

    case PlotsSection.CUSTOM_PLOTS:
      return dispatch(toggleCustomDragAndDrop(!isDragAndDropMode))

    default:
  }
}
