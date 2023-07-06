import { useDispatch } from 'react-redux'
import { View } from 'react-vega'
import { setSmoothPlotValue } from '../components/templatePlots/templatePlotsSlice'

interface VegaState {
  signals?: { [name: string]: number | undefined }
  data?: unknown
}

export const useSetupSmoothPlot = (id: string, defaultValue?: number) => {
  const dispatch = useDispatch()

  return (view: View) => {
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
