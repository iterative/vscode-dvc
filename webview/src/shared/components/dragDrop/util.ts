import { DragEvent } from 'react'

export enum DragEnterDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT'
}

export const getEventCurrentTargetDistances = (e: DragEvent<HTMLElement>) => {
  const itemClientRect = e.currentTarget.getBoundingClientRect()
  return {
    left: itemClientRect.left,
    right: itemClientRect.right
  }
}

export const getDragEnterDirection = (e: DragEvent<HTMLElement>) => {
  const cursorLocationX = e.clientX
  const { left, right } = getEventCurrentTargetDistances(e)

  const distanceFromLeft = Math.abs(cursorLocationX - left)
  const distanceFromRight = Math.abs(cursorLocationX - right)
  const closestDistanceToBorder = Math.min(distanceFromLeft, distanceFromRight)

  return closestDistanceToBorder === distanceFromLeft
    ? DragEnterDirection.LEFT
    : DragEnterDirection.RIGHT
}
