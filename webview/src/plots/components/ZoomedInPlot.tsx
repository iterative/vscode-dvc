import React, { useEffect, useRef } from 'react'
import { PlotHeight, PlotsSection } from 'dvc/src/plots/webview/contract'
import { TemplateVegaLite } from './templatePlots/TemplateVegaLite'
import styles from './styles.module.scss'
import { plotDataStore } from './plotDataStore'
import {
  exportPlotDataAsCsv,
  exportPlotDataAsJson,
  exportPlotDataAsTsv
} from '../util/messages'
import { fillTemplate, getVegaLiteProps } from '../util/vega'

type ZoomedInPlotProps = {
  id: string
  section: PlotsSection
  openActionsMenu?: boolean
}

const appendActionToVega = (
  type: string,
  vegaActions: HTMLDivElement,
  onClick: () => void
) => {
  const rawDataAction = document.createElement('a')
  rawDataAction.textContent = `Save as ${type}`
  rawDataAction.addEventListener('click', () => {
    onClick()
  })
  rawDataAction.classList.add(styles.vegaCustomAction)
  vegaActions.append(rawDataAction)
}

export const ZoomedInPlot: React.FC<ZoomedInPlotProps> = ({
  id,
  section,
  openActionsMenu
}: ZoomedInPlotProps) => {
  const zoomedInPlotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modalOpenClass = 'modalOpen'
    document.body.classList.add(modalOpenClass)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [])

  const onNewView = () => {
    const actions: HTMLDivElement | null | undefined =
      zoomedInPlotRef.current?.querySelector('.vega-actions')
    if (!actions) {
      return
    }

    appendActionToVega('JSON', actions, () => exportPlotDataAsJson(id))
    appendActionToVega('CSV', actions, () => exportPlotDataAsCsv(id))
    appendActionToVega('TSV', actions, () => exportPlotDataAsTsv(id))

    if (openActionsMenu) {
      setTimeout(() => {
        const actionsDetails = actions.parentElement as HTMLDetailsElement
        if (actionsDetails) {
          actionsDetails.open = true
        }
      }, 500)
    }
  }

  const plot = plotDataStore[section][id]
  const spec = fillTemplate(plot, 1, PlotHeight.VERTICAL_NORMAL, false)
  if (!spec) {
    return
  }
  const vegaLiteProps = getVegaLiteProps(id, spec, {
    compiled: false,
    editor: false,
    export: true,
    source: false
  })

  return (
    <div
      className={styles.zoomedInPlot}
      data-testid="zoomed-in-plot"
      ref={zoomedInPlotRef}
    >
      <TemplateVegaLite
        id={id}
        vegaLiteProps={vegaLiteProps}
        onNewView={onNewView}
      />
    </div>
  )
}
