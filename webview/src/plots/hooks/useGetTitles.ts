import {
  PLOT_TITLE_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_LABEL_ANCHOR
} from 'dvc/src/cli/dvc/contract'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'
import { getMetricVsParamTitle } from '../components/util'

type Titles = { title: string; subtitle: string }

export const useGetTitles = (
  section: PlotsSection,
  id: string
): Titles | undefined => {
  const isTemplatePlot = section === PlotsSection.TEMPLATE_PLOTS
  const storeSection = isTemplatePlot ? 'template' : 'custom'
  const { plotsSnapshots: snapshot } = useSelector(
    (state: PlotsState) => state[storeSection]
  )

  const [titles, setTitles] = useState<Titles | undefined>()

  const setPlotTitles = useCallback(() => {
    const plot = plotDataStore[section][id]
    const { anchorDefinitions } = plot

    let title = anchorDefinitions?.[PLOT_TITLE_ANCHOR] || ''
    let subtitle = ''

    if (!isTemplatePlot) {
      const yTitle = anchorDefinitions?.[PLOT_Y_LABEL_ANCHOR] || ''
      const xTitle = anchorDefinitions?.[PLOT_X_LABEL_ANCHOR] || ''

      title = getMetricVsParamTitle(yTitle, xTitle)
      subtitle = id.replace('custom-', '')
    }

    setTitles({
      subtitle,
      title
    })
  }, [section, id, isTemplatePlot])

  useEffect(() => {
    setPlotTitles()
  }, [snapshot, setPlotTitles])

  return titles
}
