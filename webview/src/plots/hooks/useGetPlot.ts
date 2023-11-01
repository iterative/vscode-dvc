import { CustomPlotData, PlotsSection } from 'dvc/src/plots/webview/contract'
import { SpecWithTitles } from 'dvc/src/plots/vega/util'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PlainObject } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'

export const useGetPlot = (section: PlotsSection, id: string) => {
  const isTemplatePlot = section === PlotsSection.TEMPLATE_PLOTS
  const storeSection = isTemplatePlot ? 'template' : 'custom'
  const snapshot = useSelector(
    (state: PlotsState) => state[storeSection].plotsSnapshots
  )

  const [data, setData] = useState<PlainObject | undefined>()
  const [spec, setSpec] = useState<SpecWithTitles | undefined>()

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]
    if (!plot) {
      return
    }

    setData(
      isTemplatePlot ? undefined : { values: (plot as CustomPlotData).values }
    )
    setSpec({
      ...plot.content,
      height: 'container',
      width: 'container'
    } as SpecWithTitles)
  }, [id, isTemplatePlot, setData, setSpec, section])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return { data, isTemplatePlot, spec }
}
