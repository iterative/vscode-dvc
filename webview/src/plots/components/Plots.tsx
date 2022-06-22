import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AddPlots, Welcome } from './GetStarted'
import { ZoomedInPlot } from './ZoomedInPlot'
import { CheckpointPlotsWrapper } from './checkpointPlots/CheckpointPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { Ribbon } from './ribbon/Ribbon'
import { setZoomedInPlot } from './webviewSlice'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { RootState } from '../store'

// eslint-disable-next-line sonarjs/cognitive-complexity
const PlotsContent = () => {
  const dispatch = useDispatch()
  const {
    hasData,
    hasPlots,
    hasSelectedPlots,
    selectedRevisions,
    zoomedInPlot
  } = useSelector((state: RootState) => state.webview)
  const hasCheckpointData = useSelector(
    (state: RootState) => state.checkpoint.hasData
  )
  const hasComparisonData = useSelector(
    (state: RootState) => state.comparison.hasData
  )
  const hasTemplateData = useSelector(
    (state: RootState) => state.template.hasData
  )

  useEffect(() => {
    const modalOpenClass = 'modal-open'
    document.body.classList.toggle(modalOpenClass, !!zoomedInPlot?.plot)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [zoomedInPlot])

  if (!hasData) {
    return <EmptyState>Loading Plots...</EmptyState>
  }

  if (!hasCheckpointData && !hasComparisonData && !hasTemplateData) {
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

  return (
    <>
      <Ribbon />
      <DragDropProvider>
        {hasTemplateData && <TemplatePlotsWrapper />}
        {hasComparisonData && <ComparisonTableWrapper />}
        {hasCheckpointData && <CheckpointPlotsWrapper />}
      </DragDropProvider>

      {zoomedInPlot?.plot && (
        <Modal
          onClose={() => {
            dispatch(setZoomedInPlot(undefined))
          }}
        >
          <ZoomedInPlot props={zoomedInPlot.plot} />
        </Modal>
      )}
    </>
  )
}

export const Plots = () => (
  <WebviewWrapper>
    <PlotsContent />
  </WebviewWrapper>
)
