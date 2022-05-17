import { PlotSize } from 'dvc/src/plots/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_NB_ITEMS_PER_ROW, getNbItemsPerRow } from '../components/util'

export const useNbItemsPerRow = (size: PlotSize) => {
  const [nbItemsPerRow, setNbItemsPerRow] = useState(DEFAULT_NB_ITEMS_PER_ROW)

  const changeNbItemsPerRow = useCallback(
    () => setNbItemsPerRow(getNbItemsPerRow(size)),
    [setNbItemsPerRow, size]
  )

  useEffect(() => {
    changeNbItemsPerRow()
  }, [size, changeNbItemsPerRow])

  useEffect(() => {
    window.addEventListener('resize', changeNbItemsPerRow)

    return () => {
      window.removeEventListener('resize', changeNbItemsPerRow)
    }
  }, [changeNbItemsPerRow])

  return nbItemsPerRow
}
