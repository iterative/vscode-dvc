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
import styles from './styles.module.scss'
import { config, createSpec } from './constants'
import { EmptyState } from './EmptyState'
import { MetricsPicker } from './MetricsPicker'
import {
  CollapsibleSectionsActions,
  PlotsSectionKeys,
  CollapsibleSectionsState,
  PlotsReducerAction,
  PlotsWebviewState
} from '../hooks/useAppReducer'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import { AllIcons } from '../../shared/components/icon/Icon'
import { getDisplayNameFromPath } from '../../util/paths'

const PlotsContainer: React.FC<{
  collapsedSections: CollapsibleSectionsState
  sectionKey: PlotsSectionKeys
  dispatch: Dispatch<PlotsReducerAction>
  title: string
  metrics?: string[]
  selectedMetrics?: string[]
  setSelectedPlots?: (selectedPlots: string[]) => void
}> = ({
  collapsedSections,
  sectionKey,
  dispatch,
  title,
  children,
  metrics,
  selectedMetrics,
  setSelectedPlots
}) => {
  const open = !collapsedSections[sectionKey]
  return (
    <div className={styles.plotsContainerWrapper}>
      <details open={open} className={styles.plotsContainer}>
        <summary
          onClick={e => {
            e.preventDefault()
            dispatch({
              sectionKey,
              type: CollapsibleSectionsActions.TOGGLE_COLLAPSED
            })
          }}
        >
          {title}
        </summary>
        <div className={styles.centered}>{open && children}</div>
      </details>
      {metrics && setSelectedPlots && selectedMetrics && (
        <div className={styles.iconMenu}>
          <IconMenu
            items={[
              {
                icon: AllIcons.LINES,
                onClickNode: (
                  <MetricsPicker
                    metrics={metrics}
                    setSelectedMetrics={setSelectedPlots}
                    selectedMetrics={selectedMetrics}
                  />
                ),
                tooltip: 'Choose metrics'
              }
            ]}
          />
        </div>
      )}
    </div>
  )
}

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

  useEffect(() => {
    const newMetrics = getMetricsFromPlots(data?.live?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(data?.live?.selectedMetrics || newMetrics)
  }, [data, setSelectedPlots, setMetrics])

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
          metrics={metrics}
          selectedMetrics={selectedPlots}
          setSelectedPlots={setSelectedMetrics}
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
