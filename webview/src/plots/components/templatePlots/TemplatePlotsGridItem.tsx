import { AnyAction } from '@reduxjs/toolkit'
import { Section, TemplatePlotEntry } from 'dvc/src/plots/webview/contract'
import React, { memo, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { changeDisabledDragIds } from './templatePlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import { SnapPoints } from '../../hooks/useSnapPoints'
import { PlotsState } from '../../store'

interface TemplatePlotsGridItemProps {
  plot: TemplatePlotEntry
  addEventsOnViewReady: () => void
  snapPoints: SnapPoints
  changeSize: (size: number) => AnyAction
}

const TemplatePlotsGridItemComponent: React.FC<TemplatePlotsGridItemProps> = ({
  plot,
  addEventsOnViewReady,
  snapPoints,
  changeSize
}) => {
  const dispatch = useDispatch()
  const currentSize = useSelector((state: PlotsState) => state.template.size)
  const { id, content, multiView } = plot
  const toggleDrag = (enabled: boolean) => {
    dispatch(changeDisabledDragIds(enabled ? [] : [id]))
  }
  const spec = useMemo(
    () => ({ ...content, height: 'container', width: 'container' }),
    [content]
  ) as VisualizationSpec

  return (
    <ZoomablePlot
      id={id}
      spec={spec}
      onViewReady={addEventsOnViewReady}
      toggleDrag={toggleDrag}
      changeSize={changeSize}
      currentSnapPoint={currentSize}
      shouldNotResize={multiView}
      section={Section.TEMPLATE_PLOTS}
      snapPoints={snapPoints}
    />
  )
}

export const TemplatePlotsGridItem = memo(TemplatePlotsGridItemComponent)
