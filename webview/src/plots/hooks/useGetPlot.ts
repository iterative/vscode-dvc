import {
  CustomPlotData,
  Section,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'

const getStoreSection = (section: Section) =>
  section === Section.TEMPLATE_PLOTS ? 'template' : 'custom'

export const useGetPlot = (
  section: Section,
  id: string,
  spec?: VisualizationSpec
) => {
  const isPlotWithSpec = section === Section.CUSTOM_PLOTS
  const storeSection = getStoreSection(section)
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

    if (isPlotWithSpec) {
      setData({ values: (plot as CustomPlotData).values })
      setContent(spec)
      return
    }

    setData(undefined)
    setContent({
      ...(plot as TemplatePlotEntry).content,
      height: 'container',
      width: 'container'
    } as VisualizationSpec)
  }, [id, isPlotWithSpec, setData, setContent, section, spec])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return { content, data }
}
