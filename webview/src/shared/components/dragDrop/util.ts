import { DragEvent } from 'react'

export enum DragEnterDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT'
}

export const getDragEnterDirection = (e: DragEvent<HTMLElement>) => {
  const cursorLocationX = e.clientX
  const itemClientRect = e.currentTarget.getBoundingClientRect()
  const itemLeftPosition = itemClientRect.left
  const itemRightPosition = itemClientRect.right

  const distanceFromLeft = Math.abs(cursorLocationX - itemLeftPosition)
  const distanceFromRight = Math.abs(cursorLocationX - itemRightPosition)

  const closestDistanceToBorder = Math.min(distanceFromLeft, distanceFromRight)

  return closestDistanceToBorder === distanceFromLeft
    ? DragEnterDirection.LEFT
    : DragEnterDirection.RIGHT
}
