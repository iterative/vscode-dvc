import React, { Dispatch, useState, useEffect } from 'react'
import {
  CheckpointPlotData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { EmptyState } from './EmptyState'
import { PlotsContainer } from './PlotsContainer'
import { ComparisonTable } from './ComparisonTable/ComparisonTable'
import { CheckpointPlots } from './CheckpointPlots'
import { StaticPlots } from './StaticPlots'
import { PlotsReducerAction, PlotsWebviewState } from '../hooks/useAppReducer'
import { getDisplayNameFromPath } from '../../util/paths'
import { sendMessage } from '../../shared/vscode'
import { Theme } from '../../shared/components/theme/Theme'

const getMetricsFromPlots = (plots?: CheckpointPlotData[]): string[] =>
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
    const newMetrics = getMetricsFromPlots(data?.checkpoints?.plots)
    setMetrics(newMetrics)
    setSelectedPlots(data?.checkpoints?.selectedMetrics || newMetrics)
  }, [data, setSelectedPlots, setMetrics])

  if (!data || !data.sectionCollapsed) {
    return EmptyState('Loading Plots...')
  }

  const { sectionCollapsed, checkpoints, plots, comparison } = data

  if (!checkpoints && !plots && !comparison) {
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
      {plots && (
        <PlotsContainer
          title={plots.sectionName}
          sectionKey={Section.PLOTS}
          currentSize={plots.size}
          {...basicContainerProps}
        >
          <StaticPlots plots={plots.plots} />
        </PlotsContainer>
      )}
      {comparison && (
        <PlotsContainer
          title={comparison.sectionName}
          sectionKey={Section.COMPARISON_TABLE}
          currentSize={comparison.size}
          {...basicContainerProps}
        >
          <ComparisonTable
            plots={comparison.plots}
            revisions={comparison.revisions}
          />
        </PlotsContainer>
      )}
      {checkpoints && (
        <PlotsContainer
          title={checkpoints.sectionName}
          sectionKey={Section.CHECKPOINT_PLOTS}
          menu={{
            metrics,
            selectedMetrics: selectedPlots,
            setSelectedPlots: setSelectedMetrics
          }}
          currentSize={checkpoints.size}
          {...basicContainerProps}
        >
          <CheckpointPlots
            plots={checkpoints.plots.filter(plot =>
              selectedPlots?.includes(getDisplayNameFromPath(plot.title))
            )}
            colors={checkpoints.colors}
          />
        </PlotsContainer>
      )}
    </Theme>
  )
}
