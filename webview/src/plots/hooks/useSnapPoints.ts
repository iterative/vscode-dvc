import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PlotsState } from '../store'

const initialSnapPoints: [number, number, number, number] = [0, 0, 0, 0]

export const useSnapPoints = () => {
  const maxSize = useSelector((state: PlotsState) => state.webview.maxPlotSize)
  const [snapPoints, setSnapPoints] =
    useState<[number, number, number, number]>(initialSnapPoints)

  useEffect(() => {
    setSnapPoints([maxSize, maxSize / 2, maxSize / 3, maxSize / 4])
  }, [maxSize])

  return snapPoints
}
