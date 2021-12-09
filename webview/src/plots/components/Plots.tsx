import React, { Dispatch, useState, useEffect } from 'react'
import {
  isVegaPlot,
  LivePlotsColors,
  LivePlotData,
  PlotsOutput,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VegaLite } from 'react-vega'
import cx from 'classnames'
import { config, createSpec } from './constants'
import { EmptyState } from './EmptyState'
import { PlotsContainer } from './PlotsContainer'
import styles from './styles.module.scss'
import { PlotsReducerAction, PlotsWebviewState } from '../hooks/useAppReducer'
import { getDisplayNameFromPath } from '../../util/paths'
import { sendMessage } from '../../shared/vscode'

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
  dispatch
}: {
  state: PlotsWebviewState
  dispatch: Dispatch<PlotsReducerAction>
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const { data } = state

  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [size, setSize] = useState<PlotSize>(PlotSize.REGULAR)

  useEffect(() => {
    const newMetrics = getMetricsFromPlots(data?.live?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(data?.live?.selectedMetrics || newMetrics)
  }, [data, setSelectedPlots, setMetrics])

  useEffect(() => {
    setSize(data?.live?.size || PlotSize.REGULAR)
  }, [data, setSize])

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [size])

  if (!data || !data.sectionCollapsed) {
    return EmptyState('Loading Plots...')
  }

  const { sectionCollapsed, live: livePlots, static: staticPlots } = data

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

  const changeSize = (size: PlotSize) => {
    setSize(size)
    sendMessage({ payload: size, type: MessageFromWebviewType.PLOTS_RESIZED })
  }

  return (
    <>
      {livePlots && (
        <PlotsContainer
          title="Live Experiments Plots"
          sectionKey={Section.LIVE_PLOTS}
          sectionCollapsed={sectionCollapsed}
          dispatch={dispatch}
          menu={{
            metrics,
            selectedMetrics: selectedPlots,
            setSelectedPlots: setSelectedMetrics,
            setSize: changeSize,
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
          sectionKey={Section.STATIC_PLOTS}
          sectionCollapsed={sectionCollapsed}
          dispatch={dispatch}
        >
          <StaticPlots plots={staticPlots} />
        </PlotsContainer>
      )}
    </>
  )
}

export default Plots
