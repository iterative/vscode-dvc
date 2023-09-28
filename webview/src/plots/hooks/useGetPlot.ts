import {
  CustomPlotData,
  DEFAULT_NB_ITEMS_PER_ROW,
  PlotsSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { truncate } from 'vega-util'
import { plotDataStore } from '../components/plotDataStore'
import { PlotsState } from '../store'

export const useGetPlot = (
  section: PlotsSection,
  id: string,
  spec?: VisualizationSpec
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  const isTemplatePlot = section === PlotsSection.TEMPLATE_PLOTS
  const storeSection = isTemplatePlot ? 'template' : 'custom'
  const {
    plotsSnapshots: snapshot,
    nbItemsPerRow,
    height
  } = useSelector((state: PlotsState) => state[storeSection])

  const [data, setData] = useState<PlainObject | undefined>(undefined)
  const [content, setContent] = useState<VisualizationSpec | undefined>(spec)

  const setPlotData = useCallback(() => {
    const plot = plotDataStore[section][id]
    if (!plot) {
      return
    }

    if (isTemplatePlot) {
      setData(undefined)
      const { content, anchor_definitions } = plot as TemplatePlotEntry
      const width = nbItemsPerRow > DEFAULT_NB_ITEMS_PER_ROW ? 30 : 50
      let specStr = content

      for (const [key, value] of Object.entries(anchor_definitions)) {
        if (['<DVC_METRIC_TITLE>', '<DVC_METRIC_X_LABEL>'].includes(key)) {
          const truncatedValue = truncate(value, width, 'left')
          specStr = specStr.replace(new RegExp(key, 'g'), truncatedValue)
        }

        if (key === '<DVC_METRIC_Y_LABEL>') {
          const truncatedVerticalValue = truncate(
            value,
            Math.floor((50 - (nbItemsPerRow - height) * 5) * 0.75),
            'left'
          )
          specStr = specStr.replace(
            new RegExp(key, 'g'),
            truncatedVerticalValue
          )
        }

        if (
          [
            '<DVC_METRIC_COLOR>',
            '<DVC_METRIC_SHAPE>',
            '<DVC_METRIC_STROKE_DASH>'
          ].includes(key)
        ) {
          const obj = JSON.parse(value) as { [key: string]: unknown }
          obj.legend = null
          specStr = specStr.replace(
            new RegExp(`"${key}"`, 'g'),
            JSON.stringify(obj)
          )
        }

        if (key === '<DVC_METRIC_DATA>') {
          specStr = specStr.replace(`"${key}"`, value)
        }
      }

      const spec = JSON.parse(specStr) as VisualizationSpec

      setContent({
        ...spec,
        height: 'container',
        width: 'container'
      } as VisualizationSpec)
      return
    }

    setData({ values: (plot as CustomPlotData).values })
    setContent(spec)
  }, [section, id, isTemplatePlot, spec, nbItemsPerRow, height])

  useEffect(() => {
    setPlotData()
  }, [snapshot, setPlotData])

  return { content, data, isTemplatePlot }
}
