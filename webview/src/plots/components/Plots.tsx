import {
  CheckpointPlotData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { CheckpointPlots } from './checkpointPlots/CheckpointPlots'
import { ComparisonTable } from './comparisonTable/ComparisonTable'
import { PlotsContainer } from './PlotsContainer'
import styles from './styles.module.scss'
import { TemplatePlots } from './templatePlots/TemplatePlots'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { Theme } from '../../shared/components/theme/Theme'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { sendMessage } from '../../shared/vscode'
import { PlotsWebviewState } from '../hooks/useAppReducer'

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
  const [zoomedInPlot, setZoomedInPlot] = useState<JSX.Element | undefined>(
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

  const handlePlotClick = (plot: JSX.Element) => setZoomedInPlot(plot)

  return (
    <Theme>
      <DragDropProvider>
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
            <div className={styles.zoomedInPlot} data-testid="zoomed-in-plot">
              {zoomedInPlot}
            </div>
          </Modal>
        )}
      </DragDropProvider>
    </Theme>
  )
}
