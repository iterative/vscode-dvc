import React, { useEffect, useRef } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { reverseOfLegendSuppressionUpdate } from 'dvc/src/plots/vega/util'
import styles from './styles.module.scss'
import { getThemeValue, ThemeProperty } from '../../util/styles'
import { useMutationObserver } from '../hooks/useMutationObserver'
import { exportPlotData } from '../util/messages'

type ZoomedInPlotProps = {
  id: string
  props: VegaLiteProps
}

export const ZoomedInPlot: React.FC<ZoomedInPlotProps> = ({
  id,
  props
}: ZoomedInPlotProps) => {
  const zoomedInPlotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modalOpenClass = 'modal-open'
    document.body.classList.add(modalOpenClass)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [])

  const onPlotChange = () => {
    const actions = zoomedInPlotRef.current?.querySelector('.vega-actions')
    const createdRawDataAction = actions?.querySelector(
      `.${styles.vegaCustomAction as string}`
    )
    if (createdRawDataAction) {
      return
    }
    const rawDataAction = document.createElement('a')
    rawDataAction.textContent = 'Save Raw Data'
    rawDataAction.addEventListener('click', () => {
      exportPlotData(id)
    })
    rawDataAction.classList.add(styles.vegaCustomAction)
    actions?.append(rawDataAction)
  }

  useMutationObserver(zoomedInPlotRef, onPlotChange)

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
      />
    </div>
  )
}
