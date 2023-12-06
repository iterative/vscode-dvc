import React, { useEffect, useRef } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { useSelector } from 'react-redux'
import { View } from 'react-vega'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { PlotsState } from '../../store'
import { setSmoothPlotValues } from '../../util/messages'
import { config } from '../constants'
import { useGetPlot } from '../../hooks/useGetPlot'

interface VegaState {
  signals?: { [name: string]: number | undefined }
  data?: unknown
}

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
  const plotWrapperEl = useRef<HTMLSpanElement>(null)
  const smoothPlotValues = useSelector(
    (state: PlotsState) => state.template.smoothPlotValues
  )
  const changeDebounceTimer = useRef(0)

  useEffect(() => {
    const newValue = smoothPlotValues[id]
    if (!newValue || !vegaView.current) {
      return
    }

    const currentState: VegaState = vegaView.current.getState()
    const currentValue: number | undefined = currentState?.signals?.smooth
    if (newValue !== currentValue) {
      vegaView.current.setState({
        ...currentState,
        signals: { ...currentState.signals, smooth: newValue }
      })
    }
  }, [smoothPlotValues, id])

  const addRangeEventListener = () => {
    const smoothRange = plotWrapperEl.current?.querySelector(
      'input[name="smooth"]'
    )

    smoothRange?.addEventListener('change', (event: Event) => {
      if (event.target) {
        window.clearTimeout(changeDebounceTimer.current)
        changeDebounceTimer.current = window.setTimeout(() => {
          setSmoothPlotValues(
            id,
            Number((event.target as HTMLInputElement).value)
          )
        }, 500)
      }
    })
  }

  return (
    <span ref={plotWrapperEl}>
      <VegaLite
        {...vegaLiteProps}
        onNewView={view => {
          onNewView(view)
          vegaView.current = view
          const defaultValue = smoothPlotValues[id]
          const state = view.getState() as VegaState

          if (!state?.signals?.smooth) {
            return
          }

          if (defaultValue) {
            view.setState({
              ...state,
              signals: { ...state.signals, smooth: defaultValue }
            })
          }

          addRangeEventListener()
        }}
      />
    </span>
  )
}
