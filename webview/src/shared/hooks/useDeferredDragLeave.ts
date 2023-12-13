import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { setIsHoveringSomething } from '../components/dragDrop/dragDropSlice'

export const useDeferredDragLeave = () => {
  const dispatch = useDispatch()
  const isHovering = useRef(false)
  const hoveringTimeout = useRef<number>(0)

  useEffect(() => {
    return () => {
      clearTimeout(hoveringTimeout.current)
    }
  }, [])

  const deferredDragLeave = useCallback(
    (callback?: () => void) => {
      isHovering.current = false
      hoveringTimeout.current = window.setTimeout(() => {
        if (!isHovering.current) {
          dispatch(setIsHoveringSomething(false))
          callback?.()
        }
      }, 500)
    },
    [dispatch]
  )

  const immediateDragLeave = useCallback(() => {
    dispatch(setIsHoveringSomething(false))
    isHovering.current = false
  }, [dispatch])

  const immediateDragEnter = useCallback(() => {
    dispatch(setIsHoveringSomething(true))
    isHovering.current = true
  }, [dispatch])

  return {
    deferredDragLeave,
    immediateDragEnter,
    immediateDragLeave
  }
}
