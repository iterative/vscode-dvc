import { useSelector } from 'react-redux'
import { PlotsState } from '../store'

export const useNbOfItemsPerRow = (
  currentNbItemsPerRow: number | undefined
) => {
  const maxNbPlotsPerRow = useSelector(
    (state: PlotsState) => state.webview.maxNbPlotsPerRow
  )

  return currentNbItemsPerRow || Math.floor(maxNbPlotsPerRow / 2)
}
