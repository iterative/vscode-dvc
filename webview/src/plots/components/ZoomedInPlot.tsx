import React, { useRef } from 'react'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { View } from 'react-vega'
import { ExtendedVegaLite } from './vegaLite/ExtendedVegaLite'
import styles from './styles.module.scss'
import {
  addExportBackgroundColor,
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
import { useModalOpenClass } from '../hooks/useModalOpenClass'

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
    ;(vegaActions.parentNode as HTMLElement).removeAttribute('open')
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
  useModalOpenClass()

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

        const fullThemedSvg = addExportBackgroundColor(
          preventSvgTruncation(themedSvg)
        )

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

  return (
    <div
      className={styles.zoomedInPlot}
      data-testid="zoomed-in-plot"
      ref={zoomedInPlotRef}
    >
      <ExtendedVegaLite
        actions={{
          compiled: false,
          editor: false,
          export: false,
          source: false
        }}
        id={id}
        onNewView={onNewView}
        parentRef={zoomedInPlotRef}
        section={section}
        focused={true}
      />
    </div>
  )
}
