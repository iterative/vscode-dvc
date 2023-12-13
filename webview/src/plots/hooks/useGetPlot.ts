import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { RefObject, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'
import { fillTemplate } from '../components/vegaLite/util'

export const useGetPlot = (
  section: PlotsSection,
  id: string,
  parentRef: RefObject<HTMLButtonElement | HTMLDivElement>,
  plotFocused: boolean
): VisualizationSpec | undefined => {
  const storeSection =
    section === PlotsSection.TEMPLATE_PLOTS ? 'template' : 'custom'
  const {
    plotsSnapshots,
    nbItemsPerRow,
    height: plotHeight,
    sectionHeight,
    sectionWidth
  } = useSelector((state: PlotsState) => state[storeSection])

  const [spec, setSpec] = useState<VisualizationSpec | undefined>()

  useEffect(() => {
    if (!parentRef.current) {
      return
    }
    const plot = plotDataStore[section][id]
    const { height, width } = parentRef.current.getBoundingClientRect()

    const spec = fillTemplate(plot, width, height, plotFocused)
    if (!spec) {
      return
    }
    setSpec(spec)
  }, [
    id,
    nbItemsPerRow,
    parentRef,
    plotFocused,
    plotHeight,
    plotsSnapshots,
    section,
    sectionHeight,
    sectionWidth
  ])

  return spec
}
