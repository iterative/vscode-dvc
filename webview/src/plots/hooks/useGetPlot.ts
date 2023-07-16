import {
  CustomPlotData,
  PlotsSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'

export const useGetPlot = (
  section: PlotsSection,
  id: string,
  spec?: VisualizationSpec
) => {
  const isTemplatePlot = section === PlotsSection.TEMPLATE_PLOTS
  const storeSection = isTemplatePlot ? 'template' : 'custom'
  const snapshot = useSelector(
    (state: PlotsState) => state[storeSection].plotsSnapshots
  )

  const [data, setData] = useState<PlainObject | undefined>(undefined)
  const [content, setContent] = useState<VisualizationSpec | undefined>(spec)

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]
    if (!plot) {
      return
    }

    if (isTemplatePlot) {
      setData(undefined)
      setContent({
        ...(plot as TemplatePlotEntry).content,
        height: 'container',
        width: 'container'
      } as VisualizationSpec)
      return
    }

    setData({ values: (plot as CustomPlotData).values })
    setContent(spec)
  }, [id, isTemplatePlot, setData, setContent, section, spec])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return { content, data, isTemplatePlot }
}
