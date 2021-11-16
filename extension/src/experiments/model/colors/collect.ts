import { copyOriginalColors } from '.'
import { definedAndNonEmpty } from '../../../util/array'

export type Colors = {
  assigned: Map<string, string>
  available: string[]
}

const getOrderedColorsToUnassign = (
  experimentIds: string[],
  currentColors: Map<string, string>
): string[] => {
  const colorsToUnassign: string[] = []
  currentColors.forEach((color: string, id: string) => {
    if (!experimentIds.includes(id)) {
      colorsToUnassign.unshift(color)
    }
  })
  return colorsToUnassign
}

const unassignColors = (
  experimentIds: string[],
  current: Map<string, string>,
  unassigned: string[]
): string[] => {
  if (!definedAndNonEmpty(experimentIds)) {
    return copyOriginalColors()
  }

  const colorsToUnassign = getOrderedColorsToUnassign(experimentIds, current)
  colorsToUnassign.forEach(color => {
    if (!unassigned.includes(color)) {
      unassigned.unshift(color)
    }
  })
  return unassigned
}

const assignColors = (
  experimentIds: string[],
  current: Map<string, string>,
  available: string[]
): Colors => {
  const assigned = new Map()

  experimentIds.forEach(id => {
    if (available.length === 0) {
      available = copyOriginalColors()
    }
    const existingColor = current.get(id)

    if (existingColor) {
      assigned.set(id, existingColor)
      return
    }

    const nextColor = available.shift() as string
    assigned.set(id, nextColor)
  })
  return { assigned, available }
}

export const collectColors = (
  experimentIds: string[],
  current: Map<string, string>,
  unassigned = copyOriginalColors()
): Colors => {
  const available = unassignColors(experimentIds, current, unassigned)

  return assignColors(experimentIds, current, available)
}
