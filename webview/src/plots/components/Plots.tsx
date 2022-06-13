import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import VegaLite from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import styles from './styles.module.scss'
import { AddPlots, Welcome } from './GetStarted'
import { CheckpointPlotsWrapper } from './checkpointPlots/CheckpointPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { Ribbon } from './ribbon/Ribbon'
import { setZoomedInPlot } from './webviewSlice'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { getThemeValue, ThemeProperty } from '../../util/styles'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { RootState } from '../store'

// eslint-disable-next-line sonarjs/cognitive-complexity
const PlotsContent = () => {
  const dispatch = useDispatch()
  const {
    hasData,
    hasPlots,
    hasSelectedPlots,
    hasSelectedRevisions,
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
    document.body.classList.toggle(modalOpenClass, !!zoomedInPlot)

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
            hasSelectedRevisions={!!hasSelectedRevisions}
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
          <div className={styles.zoomedInPlot} data-testid="zoomed-in-plot">
            <VegaLite
              {...JSON.parse(zoomedInPlot.plot)}
              config={{
                ...(JSON.parse(zoomedInPlot.plot).config as Config),
                background: getThemeValue(ThemeProperty.MENU_BACKGROUND)
              }}
              actions={{
                compiled: false,
                editor: false,
                export: true,
                source: false
              }}
            />
          </div>
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
