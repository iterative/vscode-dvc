import React, { Dispatch, useState, useEffect } from 'react'
import {
  LivePlotsColors,
  LivePlotData,
  PlotSize,
  Section,
  LivePlotValues,
  VegaPlot,
  VegaPlots
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import cx from 'classnames'
import { config, createSpec } from './constants'
import { EmptyState } from './EmptyState'
import { PlotsContainer } from './PlotsContainer'
import styles from './styles.module.scss'
import { ComparisonTable } from './ComparisonTable/ComparisonTable'
import { PlotsReducerAction, PlotsWebviewState } from '../hooks/useAppReducer'
import { getDisplayNameFromPath } from '../../util/paths'
import { sendMessage } from '../../shared/vscode'
import { withScale } from '../../util/styles'

const Plot = ({
  values,
  title,
  scale
}: {
  values: LivePlotValues
  title: string
  scale?: LivePlotsColors
}) => {
  const spec = createSpec(title, scale)

  return (
    <div
      className={styles.plot}
      style={withScale(1)}
      data-testid={`plot-${title}`}
    >
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
  colors
}: {
  plots: LivePlotData[]
  colors: LivePlotsColors
}) =>
  plots.length ? (
    <>
      {plots.map(plotData => (
        <Plot
          values={plotData.values}
          title={plotData.title}
          scale={colors}
          key={`plot-${plotData.title}`}
        />
      ))}
    </>
  ) : (
    EmptyState('No metrics selected')
  )

const StaticPlots = ({ plots }: { plots: VegaPlots }) => (
  <>
    {Object.entries(plots).map(([path, plots]) =>
      plots.map((plot: VegaPlot, i) => {
        const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
        const className = cx(styles.plot, {
          [styles.multiViewPlot]: plot.multiView
        })
        return (
          <div
            className={className}
            style={withScale(nbRevisions)}
            key={`plot-${path}-${i}`}
          >
            <VegaLite
              actions={false}
              config={config}
              spec={
                {
                  ...plot.content,
                  height: 'container',
                  width: 'container'
                } as VisualizationSpec
              }
              renderer="svg"
            />
          </div>
        )
      })
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

  useEffect(() => {
    const newMetrics = getMetricsFromPlots(data?.live?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(data?.live?.selectedMetrics || newMetrics)
  }, [data, setSelectedPlots, setMetrics])

  if (!data || !data.sectionCollapsed) {
    return EmptyState('Loading Plots...')
  }

  const {
    sectionCollapsed,
    live: livePlots,
    static: staticPlots,
    comparison: comparisonTable
  } = data

  if (!livePlots && !staticPlots && !comparisonTable) {
    return EmptyState('No Plots to Display')
  }

  const setSelectedMetrics = (metrics: string[]) => {
    setSelectedPlots(metrics)
    sendMessage({
      payload: metrics,
      type: MessageFromWebviewType.METRIC_TOGGLED
    })
  }

  const changeSize = (size: PlotSize, section: Section) => {
    sendMessage({
      payload: { section, size },
      type: MessageFromWebviewType.PLOTS_RESIZED
    })
  }

  const setSectionName = (section: Section, name: string) => {
    sendMessage({
      payload: { name, section },
      type: MessageFromWebviewType.SECTION_RENAMED
    })
  }

  const basicContainerProps = {
    dispatch,
    onRename: setSectionName,
    onResize: changeSize,
    sectionCollapsed
  }

  return (
    <>
      {livePlots && (
        <PlotsContainer
          title={livePlots.sectionName}
          sectionKey={Section.LIVE_PLOTS}
          menu={{
            metrics,
            selectedMetrics: selectedPlots,
            setSelectedPlots: setSelectedMetrics
          }}
          currentSize={livePlots.size}
          {...basicContainerProps}
        >
          <LivePlots
            plots={livePlots.plots.filter(plot =>
              selectedPlots?.includes(getDisplayNameFromPath(plot.title))
            )}
            colors={livePlots.colors}
          />
        </PlotsContainer>
      )}
      {staticPlots && (
        <PlotsContainer
          title={staticPlots.sectionName}
          sectionKey={Section.STATIC_PLOTS}
          currentSize={staticPlots.size}
          {...basicContainerProps}
        >
          <StaticPlots plots={staticPlots.plots} />
        </PlotsContainer>
      )}
      {comparisonTable && (
        <PlotsContainer
          title={comparisonTable.sectionName}
          sectionKey={Section.COMPARISON_TABLE}
          currentSize={comparisonTable.size}
          {...basicContainerProps}
        >
          <ComparisonTable
            plots={comparisonTable.plots}
            revisions={comparisonTable.revisions}
          />
        </PlotsContainer>
      )}
    </>
  )
}

export default Plots
