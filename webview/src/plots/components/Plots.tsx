import React, { useState, useEffect } from 'react'
import {
  CheckpointPlotData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { EmptyState } from './EmptyState'
import { PlotsContainer } from './PlotsContainer'
import { CheckpointPlots } from './CheckpointPlots'
import { ComparisonTable } from './comparisonTable/ComparisonTable'
import { TemplatePlots } from './templatePlots/TemplatePlots'
import { PlotsWebviewState } from '../hooks/useAppReducer'
import { sendMessage } from '../../shared/vscode'
import { Theme } from '../../shared/components/theme/Theme'

const getMetricsFromPlots = (plots?: CheckpointPlotData[]): string[] =>
  plots?.map(({ title }) => title).sort() || []

export const Plots = ({
  state
}: {
  state: PlotsWebviewState
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const { data } = state

  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])

  useEffect(() => {
    const metrics = getMetricsFromPlots(data?.checkpoint?.plots)
    setMetrics(metrics)
    setSelectedPlots(data?.checkpoint?.selectedMetrics || [])
  }, [data, setSelectedPlots, setMetrics])

  if (!data || !data.sectionCollapsed) {
    return EmptyState('Loading Plots...')
  }

  const {
    checkpoint: checkpointPlots,
    sectionCollapsed,
    template: templatePlots,
    comparison: comparisonTable
  } = data

  if (!checkpointPlots && !templatePlots && !comparisonTable) {
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
    onRename: setSectionName,
    onResize: changeSize,
    sectionCollapsed
  }

  return (
    <Theme>
      {templatePlots && (
        <PlotsContainer
          title={templatePlots.sectionName}
          sectionKey={Section.TEMPLATE_PLOTS}
          currentSize={templatePlots.size}
          {...basicContainerProps}
        >
          <TemplatePlots plots={templatePlots.plots} />
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
      {checkpointPlots && (
        <PlotsContainer
          title={checkpointPlots.sectionName}
          sectionKey={Section.CHECKPOINT_PLOTS}
          menu={{
            metrics,
            selectedMetrics: selectedPlots,
            setSelectedPlots: setSelectedMetrics
          }}
          currentSize={checkpointPlots.size}
          {...basicContainerProps}
        >
          <CheckpointPlots
            plots={checkpointPlots.plots.filter(plot =>
              selectedPlots?.includes(plot.title)
            )}
            colors={checkpointPlots.colors}
          />
        </PlotsContainer>
      )}
    </Theme>
  )
}
