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
  plotRef: RefObject<HTMLButtonElement | HTMLDivElement>,
  plotFocused: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
): VisualizationSpec | undefined => {
  const storeSection =
    section === PlotsSection.TEMPLATE_PLOTS ? 'template' : 'custom'
  const { plotsSnapshots } = useSelector(
    (state: PlotsState) => state[storeSection]
  )

  const [spec, setSpec] = useState<VisualizationSpec | undefined>()

  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!plotRef.current) {
        return
      }
      const { height, width } = plotRef.current.getBoundingClientRect()
      setHeight(height)
      setWidth(width)
    })

    if (plotRef.current) {
      resizeObserver.observe(plotRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [plotRef])

  useEffect(() => {
    const plot = plotDataStore[section][id]

    const spec = fillTemplate(plot, width, height, plotFocused)
    if (!spec) {
      return
    }
    setSpec(spec)
  }, [height, id, plotFocused, plotsSnapshots, section, width])

  return spec
}
