import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PlotsState } from '../store'

export type SnapPoints = [number, number, number, number]

export const useSnapPoints = () => {
  const maxSize = useSelector((state: PlotsState) => state.webview.maxPlotSize)
  const [snapPoints, setSnapPoints] = useState<SnapPoints>([0, 0, 0, 0])

  useEffect(() => {
    setSnapPoints([maxSize, maxSize / 2, maxSize / 3, maxSize / 4])
  }, [maxSize])

  return snapPoints
}
