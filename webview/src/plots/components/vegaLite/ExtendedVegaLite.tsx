import React, { useEffect, useRef } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { useSelector } from 'react-redux'
import { View } from 'react-vega'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { PlotsState } from '../../store'
import { setSmoothPlotValues } from '../../util/messages'
import { config } from '../constants'
import { useGetPlot } from '../../hooks/useGetPlot'

export const ExtendedVegaLite = ({
  actions,
  id,
  parentRef,
  onNewView,
  section
}: {
  actions:
    | false
    | {
        compiled: false
        editor: false
        export: false
        source: false
      }
  id: string
  parentRef: React.RefObject<HTMLDivElement | HTMLButtonElement>
  onNewView: (view: View) => void
  section: PlotsSection
}) => {
  const spec = useGetPlot(section, id, parentRef)

  const vegaLiteProps: VegaLiteProps = {
    actions,
    config,
    'data-testid': `${id}-vega`,
    renderer: 'svg',
    spec: spec || {}
  } as VegaLiteProps

  const vegaView = useRef<View>()
  const smoothPlotValues = useSelector(
    (state: PlotsState) => state.template.smoothPlotValues
  )
  const changeDebounceTimer = useRef(0)
  const currentValue = smoothPlotValues[id]

  useEffect(() => {
    if (!currentValue || !vegaView.current) {
      return
    }

    if (vegaView.current.signal('smooth') !== currentValue) {
      vegaView.current.signal('smooth', currentValue)
      vegaView.current.run()
    }
  }, [currentValue])

  return (
    <span>
      <VegaLite
        {...vegaLiteProps}
        onNewView={view => {
          onNewView(view)
          vegaView.current = view

          if (!view.signal('smooth')) {
            return
          }

          if (currentValue) {
            view.signal('smooth', currentValue)
            view.run()
          }

          view.addSignalListener('smooth', (_, value) => {
            window.clearTimeout(changeDebounceTimer.current)
            changeDebounceTimer.current = window.setTimeout(
              () => setSmoothPlotValues(id, Number(value)),
              500
            )
          })
        }}
      />
    </span>
  )
}
