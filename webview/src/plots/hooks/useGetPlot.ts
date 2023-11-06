import {
  AnchorDefinitions,
  DVC_METRIC_TITLE,
  DVC_METRIC_X_LABEL,
  DVC_METRIC_Y_LABEL
} from 'dvc/src/cli/dvc/contract'
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
): [VisualizationSpec | undefined, Partial<AnchorDefinitions> | undefined] => {
  const isTemplatePlot = section === PlotsSection.TEMPLATE_PLOTS
  const storeSection = isTemplatePlot ? 'template' : 'custom'
  const {
    plotsSnapshots: snapshot,
    nbItemsPerRow,
    height
  } = useSelector((state: PlotsState) => state[storeSection])

  const [spec, setSpec] = useState<VisualizationSpec | undefined>()
  const [titles, setTitles] = useState<Partial<AnchorDefinitions> | undefined>()

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]
    const spec = fillTemplate(plot, nbItemsPerRow, height, false)
    if (!spec) {
      return
    }
    setSpec(spec)
    setTitles({
      [DVC_METRIC_TITLE]: plot.anchor_definitions[DVC_METRIC_TITLE],
      [DVC_METRIC_X_LABEL]: plot.anchor_definitions[DVC_METRIC_X_LABEL],
      [DVC_METRIC_Y_LABEL]: plot.anchor_definitions[DVC_METRIC_Y_LABEL]
    })
  }, [section, id, nbItemsPerRow, height])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return [spec, titles]
}
