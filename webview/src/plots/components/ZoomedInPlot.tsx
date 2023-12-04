import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useRef } from 'react'
import VegaLite from 'react-vega/lib/VegaLite'
import { Config } from 'vega-lite'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import {
  SpecWithTitles,
  makePlotZoomOnWheel,
  reverseOfLegendSuppressionUpdate
} from 'dvc/src/plots/vega/util'
import { View } from 'react-vega'
import { createPlotProps } from './constants'
import { TemplateVegaLite } from './templatePlots/TemplateVegaLite'
import styles from './styles.module.scss'
import { ZoomablePlotWrapper } from './ZoomablePlotWrapper'
import {
  getThemeValue,
  preventSvgTruncation,
  replaceThemeValuesForExport,
  ThemeProperty
} from '../../util/styles'
import {
  exportPlotAsSvg,
  exportPlotDataAsCsv,
  exportPlotDataAsJson,
  exportPlotDataAsTsv
} from '../util/messages'
import { useGetPlot } from '../hooks/useGetPlot'

type ZoomedInPlotProps = {
  id: string
  isTemplatePlot: boolean
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
    ;(vegaActions.parentNode as HTMLElement).removeAttribute('open')
  })
  rawDataAction.classList.add(styles.vegaCustomAction)
  vegaActions.append(rawDataAction)
}

export const ZoomedInPlot: React.FC<ZoomedInPlotProps> = ({
  id,
  isTemplatePlot,
  openActionsMenu
}: ZoomedInPlotProps) => {
  const { data, spec } = useGetPlot(
    isTemplatePlot ? PlotsSection.TEMPLATE_PLOTS : PlotsSection.CUSTOM_PLOTS,
    id
  )
  const zoomedInPlotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modalOpenClass = 'modalOpen'
    document.body.classList.add(modalOpenClass)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [])

  if (!spec) {
    return
  }

  const props = createPlotProps(data, id, spec)
  const isCustomPlot = !isTemplatePlot
  const hasSmoothing =
    isTemplatePlot &&
    (spec as { params?: { name: string }[] }).params?.[0]?.name === 'smooth'

  const onNewView = (view: View) => {
    const actions: HTMLDivElement | null | undefined =
      zoomedInPlotRef.current?.querySelector('.vega-actions')
    if (!actions) {
      return
    }

    appendActionToVega('SVG', actions, () => {
      void view.toSVG().then(svg => {
        const themedSvg = replaceThemeValuesForExport(svg, [
          ThemeProperty.FOREGROUND_COLOR,
          ThemeProperty.FONT
        ])

        const fullThemedSvg = preventSvgTruncation(themedSvg)

        exportPlotAsSvg(fullThemedSvg)
      })
    })
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

  const specUpdate = merge(
    reverseOfLegendSuppressionUpdate(),
    makePlotZoomOnWheel(isCustomPlot, hasSmoothing)
  )

  const vegaLiteProps = {
    ...merge({ ...cloneDeep(props) }, specUpdate),
    actions: {
      compiled: false,
      editor: false,
      export: false,
      source: false
    },
    config: {
      ...(props.config as Config),
      background: getThemeValue(ThemeProperty.MENU_BACKGROUND)
    }
  }

  return (
    <ZoomablePlotWrapper spec={props.spec as SpecWithTitles}>
      <div
        className={styles.zoomedInPlot}
        data-testid="zoomed-in-plot"
        ref={zoomedInPlotRef}
      >
        {isTemplatePlot ? (
          <TemplateVegaLite
            id={id}
            vegaLiteProps={vegaLiteProps}
            onNewView={onNewView}
          />
        ) : (
          <VegaLite {...vegaLiteProps} onNewView={onNewView} />
        )}
      </div>
    </ZoomablePlotWrapper>
  )
}
