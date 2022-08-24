import { DragEvent } from 'react'

export enum DragEnterDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
  AUTO = 'AUTO',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

export const getEventCurrentTargetDistances = (e: DragEvent<HTMLElement>) => {
  const itemClientRect = e.currentTarget.getBoundingClientRect()
  return {
    bottom: itemClientRect.bottom,
    left: itemClientRect.left,
    right: itemClientRect.right,
    top: itemClientRect.top
  }
}

export const getDragEnterDirection = (
  e: DragEvent<HTMLElement>,
  vertical?: boolean
) => {
  const { bottom, left, right, top } = getEventCurrentTargetDistances(e)

  if (!vertical) {
    const cursorLocationX = e.clientX

    const distanceFromLeft = Math.abs(cursorLocationX - left)
    const distanceFromRight = Math.abs(cursorLocationX - right)
    const closestDistanceToBorder = Math.min(
      distanceFromLeft,
      distanceFromRight
    )

    return closestDistanceToBorder === distanceFromLeft
      ? DragEnterDirection.LEFT
      : DragEnterDirection.RIGHT
  }

  const cursorLocationY = e.clientX

  const distanceFromTop = Math.abs(cursorLocationY - top)
  const distanceFromBottom = Math.abs(cursorLocationY - bottom)
  const closestDistanceToBorder = Math.min(distanceFromTop, distanceFromBottom)

  return closestDistanceToBorder === distanceFromTop
    ? DragEnterDirection.TOP
    : DragEnterDirection.BOTTOM
}
