import { DragEvent } from 'react'
import { getEventCurrentTargetDistances } from './currentTarget'
import { getIDWithoutIndex } from '../../../util/ids'

export enum DragEnterDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
  AUTO = 'AUTO',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

const AFTER_DIRECTIONS = new Set([
  DragEnterDirection.RIGHT,
  DragEnterDirection.BOTTOM
])

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

  const cursorLocationY = e.clientY

  const distanceFromTop = Math.abs(cursorLocationY - top)
  const distanceFromBottom = Math.abs(cursorLocationY - bottom)
  const closestDistanceToBorder = Math.min(distanceFromTop, distanceFromBottom)

  return closestDistanceToBorder === distanceFromTop
    ? DragEnterDirection.TOP
    : DragEnterDirection.BOTTOM
}

export const isEnteringAfter = (direction: DragEnterDirection | undefined) =>
  direction && AFTER_DIRECTIONS.has(direction)

export const isExactGroup = (
  group1?: string,
  group1Alt?: string,
  group2?: string
) => group1 === group2 || group1Alt === group2

export const isSameGroup = (group1?: string, group2?: string) =>
  getIDWithoutIndex(group1) === getIDWithoutIndex(group2)

export const isSameGroupOtherSection = (group1?: string, group2?: string) =>
  isSameGroup(group1, group2) && !isExactGroup(group1, undefined, group2)
