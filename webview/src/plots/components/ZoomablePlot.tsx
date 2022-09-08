import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { Renderers } from 'vega'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { PlotSize } from 'dvc/src/plots/webview/contract'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { config } from './constants'
import { truncateTitle } from './util'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  spec: VisualizationSpec
  data?: PlainObject
  id: string
  size: PlotSize
  onViewReady?: () => void
}

const TitleLimit = {
  [PlotSize.LARGE]: 50,
  [PlotSize.REGULAR]: 50,
  [PlotSize.SMALL]: 30
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, sonarjs/cognitive-complexity
const layersWithTruncatedTitles = (layer: any, size: number) => {
  if (layer.length === 0) {
    return layer
  }

  const layerEncoding = layer[0].encoding

  return [
    {
      ...layer[0],
      encoding: layerEncoding
        ? {
            ...layerEncoding,
            x: layerEncoding.x
              ? {
                  ...layerEncoding.x,
                  title: truncateTitle(layerEncoding.x.title, size)
                }
              : {},
            y: layerEncoding.y
              ? {
                  ...layerEncoding.y,
                  title: truncateTitle(layerEncoding.y.title, size * 0.75)
                }
              : {}
          }
        : {}
    },
    ...layer.slice(1)
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withOrWithoutlayer = (spec: any, size: number) =>
  spec.layer
    ? {
        layer: layersWithTruncatedTitles(spec.layer, size)
      }
    : {}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec,
  data,
  id,
  size,
  onViewReady
}) => {
  const dispatch = useDispatch()
  const previousSpecsAndData = useRef(JSON.stringify({ data, spec }))
  const currentPlotProps = useRef<VegaLiteProps>()
  const newSpecsAndData = JSON.stringify({ data, spec })

  const plotProps: VegaLiteProps = {
    actions: false,
    config,
    data,
    'data-testid': `${id}-vega`,
    renderer: 'svg' as unknown as Renderers,
    spec: {
      ...spec,
      ...withOrWithoutlayer(spec, TitleLimit[size]),
      title: truncateTitle(spec.title, TitleLimit[size])
    }
  } as VegaLiteProps
  currentPlotProps.current = plotProps

  useEffect(() => {
    if (previousSpecsAndData.current !== newSpecsAndData) {
      dispatch(
        setZoomedInPlot({ id, plot: currentPlotProps.current, refresh: true })
      )
      previousSpecsAndData.current = newSpecsAndData
    }
  }, [newSpecsAndData, id, dispatch])

  const handleOnClick = () => dispatch(setZoomedInPlot({ id, plot: plotProps }))

  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      {currentPlotProps.current && (
        <VegaLite {...plotProps} onNewView={onViewReady} />
      )}
    </button>
  )
}
