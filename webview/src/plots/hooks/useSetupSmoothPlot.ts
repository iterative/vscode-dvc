import { useDispatch, useSelector } from 'react-redux'
import { View } from 'react-vega'
import { setSmoothPlotValue } from '../components/templatePlots/templatePlotsSlice'
import { PlotsState } from '../store'
import { setSmoothPlotValues } from '../util/messages'

interface VegaState {
  signals?: { [name: string]: number | undefined }
  data?: unknown
}

export const useSetupSmoothPlot = (id: string, isZoomedIn = false) => {
  const dispatch = useDispatch()
  const smoothPlotValues = useSelector(
    (state: PlotsState) => state.template.smoothPlotValues
  )

  return (view: View) => {
    const state = view.getState() as VegaState
    const defaultValue = smoothPlotValues[id]

    if (!state?.signals?.smooth) {
      return
    }

    if (defaultValue) {
      view.setState({
        ...state,
        signals: { ...state.signals, smooth: defaultValue }
      })
    }

    if (isZoomedIn) {
      return
    }

    const smoothRange = document.querySelector(
      `[id="${id}"] input[name="smooth"]`
    )
    smoothRange?.addEventListener('change', (event: Event) => {
      const target = event.target
      if (target) {
        const value = Number((target as HTMLInputElement).value)
        dispatch(setSmoothPlotValue({ id, value }))
        setSmoothPlotValues({
          [id]: value
        })
      }
    })
  }
}
