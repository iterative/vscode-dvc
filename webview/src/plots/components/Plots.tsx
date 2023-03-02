import React, { createRef, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AddPlots, Welcome } from './GetStarted'
import { ZoomedInPlot } from './ZoomedInPlot'
import { CheckpointPlotsWrapper } from './checkpointPlots/CheckpointPlotsWrapper'
import { CustomPlotsWrapper } from './customPlots/CustomPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { Ribbon } from './ribbon/Ribbon'
import { setSnapPoints, setZoomedInPlot } from './webviewSlice'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { PlotsState } from '../store'

// eslint-disable-next-line sonarjs/cognitive-complexity
const PlotsContent = () => {
  const dispatch = useDispatch()
  const { hasData, hasPlots, hasUnselectedPlots, zoomedInPlot } = useSelector(
    (state: PlotsState) => state.webview
  )
  const hasCheckpointData = useSelector(
    (state: PlotsState) => state.checkpoint.hasData
  )
  const hasComparisonData = useSelector(
    (state: PlotsState) => state.comparison.hasData
  )
  const hasTemplateData = useSelector(
    (state: PlotsState) => state.template.hasData
  )
  const wrapperRef = createRef<HTMLDivElement>()

  useLayoutEffect(() => {
    const onResize = () => {
      wrapperRef.current &&
        dispatch(
          setSnapPoints(wrapperRef.current.getBoundingClientRect().width - 100)
        )
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [dispatch, wrapperRef])

  if (!hasData) {
    return <EmptyState>Loading Plots...</EmptyState>
  }

  if (!hasCheckpointData && !hasComparisonData && !hasTemplateData) {
    return (
      <GetStarted
        addItems={<AddPlots hasUnselectedPlots={hasUnselectedPlots} />}
        showEmpty={!hasPlots}
        welcome={<Welcome />}
      />
    )
  }

  return (
    <div ref={wrapperRef}>
      <Ribbon />
      <TemplatePlotsWrapper />
      <ComparisonTableWrapper />
      <CheckpointPlotsWrapper />
      <CustomPlotsWrapper />

      {zoomedInPlot?.plot && (
        <Modal
          onClose={() => {
            dispatch(setZoomedInPlot(undefined))
          }}
        >
          <ZoomedInPlot props={zoomedInPlot.plot} />
        </Modal>
      )}
    </div>
  )
}

export const Plots = () => (
  <WebviewWrapper>
    <PlotsContent />
  </WebviewWrapper>
)
