import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import styles from './styles.module.scss'
import { PlotsSizeProvider } from './PlotsSizeContext'
import { GetStarted } from './GetStarted'
import { CheckpointPlotsWrapper } from './checkpointPlots/CheckpointPlotsWrapper'
import { TemplatePlotsWrapper } from './templatePlots/TemplatePlotsWrapper'
import { ComparisonTableWrapper } from './comparisonTable/ComparisonTableWrapper'
import { PlotsWebviewState } from '../hooks/useAppReducer'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Modal } from '../../shared/components/modal/Modal'
import { useThemeVariables } from '../../shared/components/theme/Theme'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { sendMessage } from '../../shared/vscode'
import { getThemeValue, ThemeProperty } from '../../util/styles'

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
    hasSelectedRevisions,
    sectionCollapsed,
    template: templatePlots
  } = data

  if (!checkpointPlots && !templatePlots && !comparisonTable) {
    return (
      <GetStarted
        hasPlots={hasPlots}
        hasSelectedPlots={hasSelectedPlots}
        hasSelectedRevisions={hasSelectedRevisions}
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

      {zoomedInPlot && (
        <Modal onClose={handleModalClose}>
          <div className={styles.zoomedInPlot} data-testid="zoomed-in-plot">
            <VegaLite
              {...zoomedInPlot}
              config={{
                ...(zoomedInPlot.config as Config),
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
    </DragDropProvider>
  )
}

export const Plots = ({ state }: PlotsProps) => {
  const variables = useThemeVariables()

  return (
    <div
      style={variables}
      onContextMenu={e => {
        e.preventDefault()
      }}
    >
      <PlotsContent state={state} />
    </div>
  )
}
