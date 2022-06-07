import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { PlotsSizeProvider } from './PlotsSizeContext'
import { AddPlots, Welcome } from './GetStarted'
import { ZoomedInPlot } from './ZoomedInPlot'
import { CheckpointPlotsWrapper } from './checkpointPlots/CheckpointPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { Ribbon } from './ribbon/Ribbon'
import { PlotsWebviewState } from '../hooks/useAppReducer'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { sendMessage } from '../../shared/vscode'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'

interface PlotsProps {
  state: PlotsWebviewState
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const PlotsContent = ({ state }: PlotsProps) => {
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

  const handleZoomInPlot = useCallback(
    (props: VegaLiteProps, id: string, refresh?: boolean) => {
      if (!refresh) {
        setZoomedInPlot(props)
        zoomedInPlotId.current = id
        return
      }

      if (zoomedInPlotId.current === id) {
        setZoomedInPlot(plot => (plot ? props : undefined))
      }
    },
    [setZoomedInPlot]
  )

  if (!data || !data.sectionCollapsed) {
    return <EmptyState>Loading Plots...</EmptyState>
  }

  const {
    checkpoint: checkpointPlots,
    comparison: comparisonTable,
    hasPlots,
    hasSelectedPlots,
    selectedRevisions,
    sectionCollapsed,
    template: templatePlots
  } = data

  if (!checkpointPlots && !templatePlots && !comparisonTable) {
    return (
      <GetStarted
        addItems={
          <AddPlots
            hasSelectedPlots={!!hasSelectedPlots}
            hasSelectedRevisions={!!selectedRevisions?.length}
          />
        }
        showEmpty={!hasPlots}
        welcome={<Welcome />}
      />
    )
  }

  const changeSize = (size: PlotSize, section: Section) => {
    sendMessage({
      payload: { section, size },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
  }

  const setSectionName = (section: Section, name: string) => {
    sendMessage({
      payload: { name, section },
      type: MessageFromWebviewType.RENAME_SECTION
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

  const currentSizeOrRegular = (
    section: { size: PlotSize } | null | undefined
  ) => section?.size || PlotSize.REGULAR

  return (
    <>
      <Ribbon revisions={selectedRevisions || []} />
      <DragDropProvider>
        <PlotsSizeProvider
          sizes={{
            [Section.CHECKPOINT_PLOTS]: currentSizeOrRegular(checkpointPlots),
            [Section.TEMPLATE_PLOTS]: currentSizeOrRegular(templatePlots),
            [Section.COMPARISON_TABLE]: currentSizeOrRegular(comparisonTable)
          }}
        >
          {templatePlots && (
            <TemplatePlotsWrapper
              templatePlots={templatePlots}
              {...wrapperProps}
            />
          )}
          {comparisonTable && (
            <ComparisonTableWrapper
              comparisonTable={comparisonTable}
              revisions={selectedRevisions || []}
              {...wrapperProps}
            />
          )}
          {checkpointPlots && (
            <CheckpointPlotsWrapper
              checkpointPlots={checkpointPlots}
              {...wrapperProps}
            />
          )}
        </PlotsSizeProvider>
      </DragDropProvider>

      {zoomedInPlot && (
        <Modal onClose={handleModalClose}>
          <ZoomedInPlot props={zoomedInPlot} />
        </Modal>
      )}
    </>
  )
}

export const Plots = ({ state }: PlotsProps) => (
  <WebviewWrapper>
    <PlotsContent state={state} />
  </WebviewWrapper>
)
