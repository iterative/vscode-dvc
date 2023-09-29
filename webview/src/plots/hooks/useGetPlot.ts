import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'
import { fillTemplate } from '../util/vega'

export const useGetPlot = (section: PlotsSection, id: string) => {
  const isTemplatePlot = section === PlotsSection.TEMPLATE_PLOTS
  const storeSection = isTemplatePlot ? 'template' : 'custom'
  const {
    plotsSnapshots: snapshot,
    nbItemsPerRow,
    height
  } = useSelector((state: PlotsState) => state[storeSection])

  const [spec, setSpec] = useState<VisualizationSpec | undefined>()

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]
    const spec = fillTemplate(plot, nbItemsPerRow, height, true)
    if (!spec) {
      return
    }

    setSpec({
      ...spec,
      height: 'container',
      width: 'container'
    } as VisualizationSpec)
  }, [section, id, nbItemsPerRow, height])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return spec
}
