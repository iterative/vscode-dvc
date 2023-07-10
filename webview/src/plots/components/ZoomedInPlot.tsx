import React, { useEffect, useRef } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { reverseOfLegendSuppressionUpdate } from 'dvc/src/plots/vega/util'
import { PlotExportType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { getThemeValue, ThemeProperty } from '../../util/styles'
import { exportPlotData } from '../util/messages'

type ZoomedInPlotProps = {
  id: string
  props: VegaLiteProps
}

const appendActionToVega = (
  type: PlotExportType,
  id: string,
  vegaActions: HTMLDivElement
) => {
  const rawDataAction = document.createElement('a')
  rawDataAction.textContent = `Save as ${type.toUpperCase()}`
  rawDataAction.addEventListener('click', () => {
    exportPlotData(id, type)
  })
  rawDataAction.classList.add(styles.vegaCustomAction)
  vegaActions.append(rawDataAction)
}

export const ZoomedInPlot: React.FC<ZoomedInPlotProps> = ({
  id,
  props
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
    appendActionToVega(PlotExportType.JSON, id, actions)
    appendActionToVega(PlotExportType.CSV, id, actions)
  }

  return (
    <div
      className={styles.zoomedInPlot}
      data-testid="zoomed-in-plot"
      ref={zoomedInPlotRef}
    >
      <VegaLite
        {...merge({ ...cloneDeep(props) }, reverseOfLegendSuppressionUpdate())}
        config={{
          ...(props.config as Config),
          background: getThemeValue(ThemeProperty.MENU_BACKGROUND)
        }}
        actions={{
          compiled: false,
          editor: false,
          export: true,
          source: false
        }}
        onNewView={onNewView}
      />
    </div>
  )
}
