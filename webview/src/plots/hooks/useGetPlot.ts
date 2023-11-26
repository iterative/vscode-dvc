import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'
import { fillTemplate } from '../components/vegaLite/util'

export const useGetPlot = (
  section: PlotsSection,
  id: string
): VisualizationSpec | undefined => {
  const storeSection =
    section === PlotsSection.TEMPLATE_PLOTS ? 'template' : 'custom'
  const {
    plotsSnapshots: snapshot,
    nbItemsPerRow,
    height
  } = useSelector((state: PlotsState) => state[storeSection])

  const [spec, setSpec] = useState<VisualizationSpec | undefined>()

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]
    const spec = fillTemplate(plot, nbItemsPerRow, height, false)
    if (!spec) {
      return
    }
    setSpec(spec)
  }, [section, id, nbItemsPerRow, height])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return spec
}
