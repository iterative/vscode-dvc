import React, { Dispatch, useState, useEffect } from 'react'
import {
  isVegaPlot,
  LivePlotsColors,
  LivePlotData,
  PlotsOutput,
  Section
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from 'dvc/src/webview/contract'
import { VegaLite } from 'react-vega'
import { config, createSpec, PlotDimensions } from './constants'
import { EmptyState } from './EmptyState'
import { PlotSize } from './SizePicker'
import { PlotsContainer } from './PlotsContainer'
import { PlotsReducerAction, PlotsWebviewState } from '../hooks/useAppReducer'
import { getDisplayNameFromPath } from '../../util/paths'

const Plot = ({
  values,
  title,
  size,
  scale
}: {
  values: { x: number; y: number; group: string }[]
  title: string
  size: keyof typeof PlotDimensions
  scale?: LivePlotsColors
}) => {
  const spec = createSpec(title, size, scale)

  return (
    <div data-testid={`plot-${title}`}>
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
  size: keyof typeof PlotDimensions
}) =>
  plots.length ? (
    <>
      {plots.map(plotData => (
        <Plot
          values={plotData.values}
          title={plotData.title}
          scale={colors}
          size={size}
          key={`plot-${plotData.title}`}
        />
      ))}
    </>
  ) : (
    EmptyState('No metrics selected')
  )

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
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const { data } = state

  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [size, setSize] = useState<keyof typeof PlotDimensions>(
    PlotSize.REGULAR
  )

  useEffect(() => {
    const newMetrics = getMetricsFromPlots(data?.live?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(data?.live?.selectedMetrics || newMetrics)
  }, [data, setSelectedPlots, setMetrics])

  if (!data || !data.collapsedSections) {
    return EmptyState('Loading Plots...')
  }

  const { collapsedSections, live: livePlots, static: staticPlots } = data

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
          sectionKey={Section.LIVE_PLOTS}
          collapsedSections={collapsedSections}
          dispatch={dispatch}
          menu={{
            metrics,
            selectedMetrics: selectedPlots,
            setSelectedPlots: setSelectedMetrics,
            setSize
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
