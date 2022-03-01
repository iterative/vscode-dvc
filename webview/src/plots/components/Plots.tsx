import React, { Dispatch, useState, useEffect } from 'react'
import { LivePlotData, PlotSize, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { EmptyState } from './EmptyState'
import { PlotsContainer } from './PlotsContainer'
import { ComparisonTable } from './ComparisonTable/ComparisonTable'
import { LivePlots } from './LivePlots'
import { StaticPlots } from './StaticPlots'
import { PlotsReducerAction, PlotsWebviewState } from '../hooks/useAppReducer'
import { getDisplayNameFromPath } from '../../util/paths'
import { sendMessage } from '../../shared/vscode'
import { Theme } from '../../shared/components/theme/Theme'

const getMetricsFromPlots = (plots?: LivePlotData[]): string[] =>
  plots?.map(plot => getDisplayNameFromPath(plot.title)) || []

export const Plots = ({
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
    <Theme>
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
    </Theme>
  )
}
