import React, { useEffect, useRef } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { reverseOfLegendSuppressionUpdate } from 'dvc/src/plots/vega/util'
import styles from './styles.module.scss'
import { getThemeValue, ThemeProperty } from '../../util/styles'
import { useMutationObserver } from '../hooks/useMutationObserver'

type ZoomedInPlotProps = {
  props: VegaLiteProps
}

export const ZoomedInPlot: React.FC<ZoomedInPlotProps> = ({
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

  const onPopupChange = () => {
    const actions = zoomedInPlotRef.current?.querySelector('.vega-actions')
    const customAction = actions?.querySelector(
      `.${styles.vegaCustomAction as string}`
    )
    if (customAction) {
      return
    }
    const myAction = document.createElement('a')
    myAction.textContent = 'Save as Raw Data'
    myAction.addEventListener('click', () => {
      // time to export!
    })
    myAction.classList.add(styles.vegaCustomAction)
    actions?.append(myAction)
  }

  useMutationObserver(zoomedInPlotRef.current, onPopupChange)

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
        className="vegaEmbed"
      />
    </div>
  )
}
