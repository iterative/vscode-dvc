import React, { useState, useEffect } from 'react'
import { VegaLite } from 'react-vega'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import {
  CheckpointPlotData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsContainer } from './PlotsContainer'
import { CheckpointPlots } from './checkpointPlots/CheckpointPlots'
import { ComparisonTable } from './comparisonTable/ComparisonTable'
import { TemplatePlots } from './templatePlots/TemplatePlots'
import styles from './styles.module.scss'
import { PlotsWebviewState } from '../hooks/useAppReducer'
import { sendMessage } from '../../shared/vscode'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Theme } from '../../shared/components/theme/Theme'
import { Modal } from '../../shared/components/modal/Modal'

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
  const [zoomedInPlot, setZoomedInPlot] = useState<VegaLiteProps | undefined>(
    undefined
  )

  useEffect(() => {
    const metrics = getMetricsFromPlots(data?.checkpoint?.plots)
    setMetrics(metrics)
    setSelectedPlots(data?.checkpoint?.selectedMetrics || [])
  }, [data, setSelectedPlots, setMetrics])

  useEffect(() => {
    const modalOpenClass = 'modal-open'
    document.body.classList.toggle(modalOpenClass, !!zoomedInPlot)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [zoomedInPlot])

  if (!data || !data.sectionCollapsed) {
    return <EmptyState>Loading Plots...</EmptyState>
  }

  const {
    checkpoint: checkpointPlots,
    sectionCollapsed,
    template: templatePlots,
    comparison: comparisonTable
  } = data

  if (!checkpointPlots && !templatePlots && !comparisonTable) {
    return <EmptyState>No Plots to Display</EmptyState>
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

  const handlePlotClick = (plot: VegaLiteProps) => setZoomedInPlot(plot)

  return (
    <Theme>
      {templatePlots && (
        <PlotsContainer
          title={templatePlots.sectionName}
          sectionKey={Section.TEMPLATE_PLOTS}
          currentSize={templatePlots.size}
          {...basicContainerProps}
        >
          <TemplatePlots
            plots={templatePlots.plots}
            onPlotClick={handlePlotClick}
          />
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
            onPlotClick={handlePlotClick}
          />
        </PlotsContainer>
      )}
      {zoomedInPlot && (
        <Modal onClose={() => setZoomedInPlot(undefined)}>
          <div className={styles.zoomedInPlot}>
            <VegaLite {...zoomedInPlot} />
          </div>
        </Modal>
      )}
    </Theme>
  )
}
