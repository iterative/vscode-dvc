import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import styles from './styles.module.scss'
import { CheckpointPlotsWrapper } from './checkpointPlots/CheckpointPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { PlotsWebviewState } from '../hooks/useAppReducer'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { Theme } from '../../shared/components/theme/Theme'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { sendMessage } from '../../shared/vscode'

// eslint-disable-next-line sonarjs/cognitive-complexity
export const Plots = ({ state }: { state: PlotsWebviewState }) => {
  const { data } = state

  const [zoomedInPlot, setZoomedInPlot] = useState<VegaLiteProps | undefined>(
    undefined
  )
  const zoomedInPlotId = useRef('')

  useEffect(() => {
    const modalOpenClass = 'modal-open'
    document.body.classList.toggle(modalOpenClass, !!zoomedInPlot)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [zoomedInPlot])

  const handleZoomInPlot = useCallback((
    props: VegaLiteProps,
    id: string,
    refresh?: boolean
  ) => {
    if (!refresh) {
      setZoomedInPlot(props)
      zoomedInPlotId.current = id
      return
    }

    if (zoomedInPlotId.current && zoomedInPlot) {
      if (zoomedInPlotId.current === id) {
        setZoomedInPlot(props)
      }
    }
  }, [setZoomedInPlot, zoomedInPlot])

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

  const handleModalClose = () => {
    setZoomedInPlot(undefined)
    zoomedInPlotId.current = ''
  }

  const wrapperProps = {
    basicContainerProps,
    renderZoomedInPlot: handleZoomInPlot
  }

  return (
    <Theme>
      <DragDropProvider>
        {templatePlots && (
          <TemplatePlotsWrapper
            templatePlots={templatePlots}
            {...wrapperProps}
          />
        )}
        {comparisonTable && (
          <ComparisonTableWrapper
            comparisonTable={comparisonTable}
            {...wrapperProps}
          />
        )}
        {checkpointPlots && (
          <CheckpointPlotsWrapper
            checkpointPlots={checkpointPlots}
            {...wrapperProps}
          />
        )}
        {zoomedInPlot && (
          <Modal onClose={handleModalClose}>
            <div className={styles.zoomedInPlot} data-testid="zoomed-in-plot">
              <VegaLite {...zoomedInPlot} />
            </div>
          </Modal>
        )}
      </DragDropProvider>
    </Theme>
  )
}
