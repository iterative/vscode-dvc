import React, { Dispatch, useState, useEffect } from 'react'
import {
  isVegaPlot,
  LivePlotsColors,
  LivePlotData,
  PlotsOutput
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from 'dvc/src/webview/contract'
import { VegaLite } from 'react-vega'
import cx from 'classnames'
import { config, createSpec } from './constants'
import { EmptyState } from './EmptyState'
import { PlotSize } from './SizePicker'
import { PlotsContainer } from './PlotsContainer'
import styles from './styles.module.scss'
import {
  PlotsSectionKeys,
  PlotsReducerAction,
  PlotsWebviewState
} from '../hooks/useAppReducer'
import { getDisplayNameFromPath } from '../../util/paths'

const Plot = ({
  values,
  title,
  scale
}: {
  values: { x: number; y: number; group: string }[]
  title: string
  scale?: LivePlotsColors
}) => {
  const spec = createSpec(title, scale)

  return (
    <div className={styles.plot} data-testid={`plot-${title}`}>
      <VegaLite
        actions={false}
        config={config}
        spec={spec}
        data={{ values }}
        renderer="svg"
      />
    </div>
  )
}

const LivePlots = ({
  plots,
  colors,
  size
}: {
  plots: LivePlotData[]
  colors: LivePlotsColors
  size: PlotSize
}) => {
  const sizeClass = cx(styles.plotsWrapper, {
    [styles.smallPlots]: size === PlotSize.SMALL,
    [styles.regularPlots]: size === PlotSize.REGULAR,
    [styles.largePlots]: size === PlotSize.LARGE
  })

  return plots.length ? (
    <div className={sizeClass} data-testid="plots-wrapper">
      {plots.map(plotData => (
        <Plot
          values={plotData.values}
          title={plotData.title}
          scale={colors}
          key={`plot-${plotData.title}`}
        />
      ))}
    </div>
  ) : (
    EmptyState('No metrics selected')
  )
}

const StaticPlots = ({ plots }: { plots: PlotsOutput }) => (
  <>
    {Object.entries(plots).map(([path, plots]) =>
      plots.map((plot, i) =>
        isVegaPlot(plot) ? (
          <VegaLite
            actions={false}
            config={config}
            spec={plot.content}
            renderer="svg"
            key={`plot-${path}-${i}`}
          />
        ) : undefined
      )
    )}
  </>
)

const getMetricsFromPlots = (plots?: LivePlotData[]): string[] =>
  plots?.map(plot => getDisplayNameFromPath(plot.title)) || []

const Plots = ({
  state,
  dispatch,
  sendMessage
}: {
  state: PlotsWebviewState
  dispatch: Dispatch<PlotsReducerAction>
  sendMessage: (message: MessageFromWebview) => void
}) => {
  const { data, collapsedSections } = state
  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [size, setSize] = useState<PlotSize>(PlotSize.REGULAR)

  useEffect(() => {
    const newMetrics = getMetricsFromPlots(data?.live?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(data?.live?.selectedMetrics || newMetrics)
  }, [data, setSelectedPlots, setMetrics])

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [size])

  if (!data) {
    return EmptyState('Loading Plots...')
  }

  const { live: livePlots, static: staticPlots } = data

  if (!livePlots && !staticPlots) {
    return EmptyState('No Plots to Display')
  }

  const setSelectedMetrics = (metrics: string[]) => {
    setSelectedPlots(metrics)
    sendMessage({
      payload: metrics,
      type: MessageFromWebviewType.METRIC_TOGGLED
    })
  }

  return (
    <>
      {livePlots && (
        <PlotsContainer
          title="Live Experiments Plots"
          sectionKey={PlotsSectionKeys.LIVE_PLOTS}
          collapsedSections={collapsedSections}
          dispatch={dispatch}
          menu={{
            metrics,
            selectedMetrics: selectedPlots,
            setSelectedPlots: setSelectedMetrics,
            setSize,
            size
          }}
        >
          <LivePlots
            plots={livePlots.plots.filter(plot =>
              selectedPlots?.includes(getDisplayNameFromPath(plot.title))
            )}
            colors={livePlots.colors}
            size={size}
          />
        </PlotsContainer>
      )}
      {staticPlots && (
        <PlotsContainer
          title="Static Plots"
          sectionKey={PlotsSectionKeys.STATIC_PLOTS}
          collapsedSections={collapsedSections}
          dispatch={dispatch}
        >
          <StaticPlots plots={staticPlots} />
        </PlotsContainer>
      )}
    </>
  )
}

export default Plots
