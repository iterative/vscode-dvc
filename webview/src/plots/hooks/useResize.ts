import { AnyAction } from '@reduxjs/toolkit'
import { Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage } from '../../shared/vscode'
import { PlotsState } from '../store'

interface SnapPoints {
  1: number
  2: number
  3: number
  4: number
}

const initialSnapPoints = {
  1: 0,
  2: 0,
  3: 0,
  4: 0
}

export const useResize = (
  section: Section,
  changeSize: (size: number) => AnyAction
) => {
  const dispatch = useDispatch()
  const maxSize = useSelector((state: PlotsState) => state.webview.maxPlotSize)
  const [snapPoints, setSnapPoints] = useState<SnapPoints>(initialSnapPoints)

  useEffect(() => {
    setSnapPoints({
      1: maxSize,
      2: maxSize / 2,
      3: maxSize / 3,
      4: maxSize / 4
    })
  }, [maxSize])

  const onResize = useCallback(
    (newSnapPoint: number) => {
      dispatch(changeSize(newSnapPoint))
      sendMessage({
        payload: { section, size: newSnapPoint },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })
    },
    [dispatch, changeSize, section]
  )

  return { onResize, snapPoints: Object.values(snapPoints) }
}
