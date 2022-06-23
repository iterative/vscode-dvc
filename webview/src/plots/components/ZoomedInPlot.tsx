import React, { useEffect } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import styles from './styles.module.scss'
import { getThemeValue, ThemeProperty } from '../../util/styles'

export type ZoomedInPlotProps = {
  props: VegaLiteProps
}

export const ZoomedInPlot: React.FC<ZoomedInPlotProps> = ({
  props
}: ZoomedInPlotProps) => {
  useEffect(() => {
    const modalOpenClass = 'modal-open'
    document.body.classList.add(modalOpenClass)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [])

  return (
    <div className={styles.zoomedInPlot} data-testid="zoomed-in-plot">
      <VegaLite
        {...merge(
          { ...cloneDeep(props) },
          {
            spec: { encoding: { color: { legend: { disable: false } } } }
          }
        )}
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
