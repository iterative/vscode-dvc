import React from 'react'
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
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { PlotsState } from '../store'

// eslint-disable-next-line sonarjs/cognitive-complexity
const PlotsContent = () => {
  const dispatch = useDispatch()
  const {
    hasData,
    hasPlots,
    hasSelectedPlots,
    selectedRevisions,
    zoomedInPlot
  } = useSelector((state: PlotsState) => state.webview)
  const hasCheckpointData = useSelector(
    (state: PlotsState) => state.checkpoint.hasData
  )
  const hasComparisonData = useSelector(
    (state: PlotsState) => state.comparison.hasData
  )
  const hasTemplateData = useSelector(
    (state: PlotsState) => state.template.hasData
  )

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
      <TemplatePlotsWrapper />
      <ComparisonTableWrapper />
      <CheckpointPlotsWrapper />

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
