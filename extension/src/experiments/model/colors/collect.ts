import { Color, copyOriginalColors } from '.'
import { definedAndNonEmpty } from '../../../util/array'

export type Colors = {
  assigned: Map<string, Color>
  available: Color[]
}

const getOrderedColorsToUnassign = (
  experimentIds: string[],
  currentColors: Map<string, Color>
): Color[] => {
  const colorsToUnassign: Color[] = []
  for (const [id, color] of currentColors) {
    if (!experimentIds.includes(id)) {
      colorsToUnassign.unshift(color)
    }
  }
  return colorsToUnassign
}

export const unassignColors = (
  experimentIds: string[],
  current: Map<string, Color>,
  unassigned: Color[]
): Color[] => {
  if (!definedAndNonEmpty(experimentIds)) {
    return copyOriginalColors()
  }

  const colorsToUnassign = getOrderedColorsToUnassign(experimentIds, current)
  for (const color of colorsToUnassign) {
    if (!unassigned.includes(color)) {
      unassigned.unshift(color)
    }
  }
  return unassigned
}

const assignColors = (
  experimentIds: string[],
  current: Map<string, Color>,
  available: Color[]
): Colors => {
  const assigned = new Map()

  for (const id of experimentIds) {
    const existingColor = current.get(id)

    if (existingColor) {
      assigned.set(id, existingColor)
      continue
    }

    if (available.length === 0) {
      continue
    }

    const nextColor = available.shift() as string
    assigned.set(id, nextColor)
  }
  return { assigned, available }
}

// can remove the whole thing

export const collectColors = (
  ids: string[],
  current: Map<string, Color>,
  unassigned: Color[]
): Colors => {
  const available = unassignColors(ids, current, unassigned)

  return assignColors(ids, current, available)
}
