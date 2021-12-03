import React, { Dispatch, useState, useEffect } from 'react'
import {
  LivePlotsColors,
  LivePlotData,
  PlotsOutput,
  PlotsType,
  StaticPlot,
  VegaPlot
} from 'dvc/src/plots/webview/contract'
import { VegaLite } from 'react-vega'
import { config, createSpec, PlotDimensions } from './constants'
import { EmptyState } from './EmptyState'
import { PlotSize } from './SizePicker'
import { PlotsContainer } from './PlotsContainer'
import {
  PlotsSectionKeys,
  PlotsReducerAction,
  PlotsWebviewState
} from '../hooks/useAppReducer'
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

const isVega = (plot: StaticPlot): plot is VegaPlot =>
  plot.type === PlotsType.VEGA

const StaticPlots = ({ plots }: { plots: PlotsOutput }) => (
  <>
    {Object.entries(plots).map(([path, plots]) =>
      plots.map(plot =>
        isVega(plot) ? (
          <VegaLite
            actions={false}
            config={config}
            spec={plot.content}
            renderer="svg"
            key={`plot-${path}`}
          />
        ) : (
          <></>
        )
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
}) => {
  const { data, collapsedSections } = state
  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [size, setSize] = useState<keyof typeof PlotDimensions>(
    PlotSize.REGULAR
  )

  useEffect(() => {
    const newMetrics = getMetricsFromPlots(data?.live?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(newMetrics)
  }, [data, setSelectedPlots, setMetrics])

  if (!data) {
    return EmptyState('Loading Plots...')
  }

  const { live: livePlots, static: staticPlots } = data

  if (!livePlots && !staticPlots) {
    return EmptyState('No Plots to Display')
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
            setSelectedPlots,
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
