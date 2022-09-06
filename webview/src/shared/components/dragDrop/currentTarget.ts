import { DragEvent } from 'react'

export const getEventCurrentTargetDistances = (e: DragEvent<HTMLElement>) => {
  const itemClientRect = e.currentTarget.getBoundingClientRect()
  return {
    bottom: itemClientRect.bottom,
    left: itemClientRect.left,
    right: itemClientRect.right,
    top: itemClientRect.top
  }
}
