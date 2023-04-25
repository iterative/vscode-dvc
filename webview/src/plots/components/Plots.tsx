import React, { createRef, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AddPlots, Welcome } from './GetStarted'
import { ZoomedInPlot } from './ZoomedInPlot'
import { CustomPlotsWrapper } from './customPlots/CustomPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { Ribbon } from './ribbon/Ribbon'
import { setMaxNbPlotsPerRow, setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { PlotsState } from '../store'
import { sendDimensions } from './messages'

const PlotsContent = () => {
  const dispatch = useDispatch()
  const { hasData, hasPlots, hasUnselectedPlots, zoomedInPlot, cliError } =
    useSelector((state: PlotsState) => state.webview)
  const hasComparisonData = useSelector(
    (state: PlotsState) => state.comparison.hasData
  )
  const hasTemplateData = useSelector(
    (state: PlotsState) => state.template.hasData
  )
  const customPlotIds = useSelector(
    (state: PlotsState) => state.custom.plotsIds
  )
  const wrapperRef = createRef<HTMLDivElement>()

  useLayoutEffect(() => {
    const onResize = () => {
      if (wrapperRef.current) {
        // Plots grid have a 20px margin around it, we subtract 20 * 2 from the wrapper width to get the max available space
        const wrapperClientRect = wrapperRef.current.getBoundingClientRect()
        const width = wrapperClientRect.width - 40
        const height = wrapperClientRect.height

        dispatch(setMaxNbPlotsPerRow(width))
        sendDimensions(width, height)
      }
    }
    window.addEventListener('resize', onResize)
    onResize()

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [dispatch, wrapperRef])

  if (!hasData) {
    return <EmptyState>Loading Plots...</EmptyState>
  }

  const modal = zoomedInPlot?.plot && (
    <Modal
      onClose={() => {
        dispatch(setZoomedInPlot(undefined))
      }}
    >
      <ZoomedInPlot props={zoomedInPlot.plot} />
    </Modal>
  )

  const hasNoCustomPlots = customPlotIds.length === 0

  if (!hasComparisonData && !hasTemplateData) {
    return (
      <div className={styles.getStartedWrapper}>
        <GetStarted
          addItems={
            <AddPlots
              hasUnselectedPlots={hasUnselectedPlots}
              hasNoCustomPlots={hasNoCustomPlots}
              cliError={cliError}
            />
          }
          showEmpty={!hasPlots && !cliError}
          welcome={<Welcome />}
          isFullScreen={hasNoCustomPlots}
        />
        {!hasNoCustomPlots && (
          <>
            <CustomPlotsWrapper />
            {modal}
          </>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapperRef}>
      <Ribbon />
      <TemplatePlotsWrapper />
      <ComparisonTableWrapper />
      <CustomPlotsWrapper />

      {modal}
    </div>
  )
}

export const Plots = () => (
  <WebviewWrapper>
    <PlotsContent />
  </WebviewWrapper>
)
