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
  unassigned: string[],
  copyOriginalColors: () => string[]
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
  available: string[],
  copyOriginalColors: () => string[]
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
  ids: string[],
  current: Map<string, string>,
  unassigned: string[],
  copyOriginalColors: () => string[]
): Colors => {
  const available = unassignColors(ids, current, unassigned, copyOriginalColors)

  return assignColors(ids, current, available, copyOriginalColors)
}
