import { useDispatch, useSelector } from 'react-redux'
import { View } from 'react-vega'
import { setSmoothPlotValue } from '../components/templatePlots/templatePlotsSlice'
import { PlotsState } from '../store'

interface VegaState {
  signals?: { [name: string]: number | undefined }
  data?: unknown
}

export const useSetupSmoothPlot = (id: string) => {
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

    const smoothRange = document.querySelector(
      `[data-id="${id}"] input[name="smooth"]`
    )
    smoothRange?.addEventListener('change', (event: Event) => {
      if (event.target) {
        dispatch(
          setSmoothPlotValue({
            id,
            value: Number((event.target as HTMLInputElement).value)
          })
        )
      }
    })
  }
}
