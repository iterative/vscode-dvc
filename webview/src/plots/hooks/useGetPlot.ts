import {
  AnchorDefinitions,
  PLOT_TITLE_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_LABEL_ANCHOR
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
      [PLOT_TITLE_ANCHOR]: plot.anchorDefinitions[PLOT_TITLE_ANCHOR] as string,
      [PLOT_X_LABEL_ANCHOR]: plot.anchorDefinitions[
        PLOT_X_LABEL_ANCHOR
      ] as string,
      [PLOT_Y_LABEL_ANCHOR]: plot.anchorDefinitions[
        PLOT_Y_LABEL_ANCHOR
      ] as string
    })
  }, [section, id, nbItemsPerRow, height])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return [spec, titles]
}
