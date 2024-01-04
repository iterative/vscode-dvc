import React, { createRef, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ErrorState } from './emptyState/ErrorState'
import { GetStarted } from './emptyState/GetStarted'
import { ZoomedInPlot } from './ZoomedInPlot'
import { ErrorsModal } from './ErrorsModal'
import { CustomPlotsWrapper } from './customPlots/CustomPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { Ribbon } from './ribbon/Ribbon'
import {
  setMaxNbPlotsPerRow,
  setZoomedInPlot,
  setShowErrorsModal
} from './webviewSlice'
import styles from './styles.module.scss'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { PlotsState } from '../store'

export const PlotsContent = () => {
  const dispatch = useDispatch()
  const {
    hasData,
    hasPlots,
    hasUnselectedPlots,
    zoomedInPlot,
    cliError,
    showErrorsModal
  } = useSelector((state: PlotsState) => state.webview)
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
      wrapperRef.current &&
        dispatch(
          setMaxNbPlotsPerRow(
            // Plots grid have a 20px margin around it, we subtract 20 * 2 from the wrapper width to get the max available space
            wrapperRef.current.getBoundingClientRect().width - 40
          )
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

  const modal = zoomedInPlot?.id && (
    <Modal
      onClose={() => {
        dispatch(setZoomedInPlot(undefined))
      }}
    >
      <ZoomedInPlot
        id={zoomedInPlot.id}
        openActionsMenu={zoomedInPlot.openActionsMenu}
        section={zoomedInPlot.section}
      />
    </Modal>
  )

  const errorsModal = showErrorsModal && (
    <Modal
      onClose={() => {
        dispatch(setShowErrorsModal(false))
      }}
    >
      <ErrorsModal />
    </Modal>
  )

  const hasCustomPlots = customPlotIds.length > 0

  if (cliError) {
    return (
      <ErrorState
        cliError={cliError}
        hasCustomPlots={hasCustomPlots}
        modal={modal}
      />
    )
  }

  if (!hasComparisonData && !hasTemplateData) {
    return (
      <GetStarted
        hasCustomPlots={hasCustomPlots}
        hasPlots={hasPlots}
        hasUnselectedPlots={hasUnselectedPlots}
        modal={modal}
      />
    )
  }

  return (
    <div ref={wrapperRef} className={styles.plotsContent}>
      <Ribbon />
      <TemplatePlotsWrapper />
      <ComparisonTableWrapper />
      <CustomPlotsWrapper />
      {modal}
      {errorsModal}
    </div>
  )
}
