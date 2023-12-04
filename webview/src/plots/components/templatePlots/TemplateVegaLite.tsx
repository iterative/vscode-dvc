import React, { useEffect, useRef } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { useSelector } from 'react-redux'
import { View } from 'react-vega'
import { PlotsState } from '../../store'
import { setSmoothPlotValues } from '../../util/messages'

export const TemplateVegaLite = ({
  id,
  onNewView,
  vegaLiteProps
}: {
  id: string
  onNewView: (view: View) => void
  vegaLiteProps: VegaLiteProps
}) => {
  const vegaView = useRef<View>()
  const smoothPlotValues = useSelector(
    (state: PlotsState) => state.template.smoothPlotValues
  )
  const currentValue = smoothPlotValues[id]

  useEffect(() => {
    return () => {
      vegaView.current?.finalize()
    }
  }, [])

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
            setSmoothPlotValues(id, Number(value))
          })
        }}
      />
    </span>
  )
}
