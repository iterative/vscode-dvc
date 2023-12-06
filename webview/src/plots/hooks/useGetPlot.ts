import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { RefObject, useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'
import { fillTemplate } from '../components/vegaLite/util'

export const useGetPlot = (
  section: PlotsSection,
  id: string,
  plotRef: RefObject<HTMLButtonElement | HTMLDivElement>
): VisualizationSpec | undefined => {
  const storeSection =
    section === PlotsSection.TEMPLATE_PLOTS ? 'template' : 'custom'
  const {
    plotsSnapshots: snapshot,
    nbItemsPerRow,
    height: itemHeight
  } = useSelector((state: PlotsState) => state[storeSection])

  const [spec, setSpec] = useState<VisualizationSpec | undefined>()

  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(0)

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]

    const spec = fillTemplate(plot, width, height, false)
    if (!spec) {
      return
    }
    setSpec(spec)
  }, [section, id, width, height])

  useEffect(() => {
    const onResize = () => {
      if (!plotRef.current) {
        return
      }
      const { height, width } = plotRef.current.getBoundingClientRect()
      setHeight(height)
      setWidth(width)
    }
    window.addEventListener('resize', onResize)

    onResize()

    setPlotData()
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [snapshot, setPlotData, plotRef, nbItemsPerRow, itemHeight])

  return spec
}
