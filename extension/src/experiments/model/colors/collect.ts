import { colorsList as originalColorsList } from '.'
import { definedAndNonEmpty } from '../../../util/array'

export type Colors = {
  assigned: Map<string, string>
  available: string[]
}

const getOrderedColorsToUnassign = (
  experimentNames: string[],
  currentColors: Map<string, string>
) => {
  const colorsToUnassign: string[] = []
  currentColors.forEach((color: string, name: string) => {
    if (!experimentNames.includes(name)) {
      colorsToUnassign.unshift(color)
    }
  })
  return colorsToUnassign
}

const unassignColors = (
  experimentNames: string[],
  current: Map<string, string>,
  unassigned: string[]
): string[] => {
  if (!definedAndNonEmpty(experimentNames)) {
    return [...originalColorsList]
  }

  const colorsToUnassign = getOrderedColorsToUnassign(experimentNames, current)
  colorsToUnassign.forEach(color => unassigned.unshift(color))
  return unassigned
}

const assignColors = (
  experimentNames: string[],
  current: Map<string, string>,
  available: string[]
): Colors => {
  const assigned = new Map()

  experimentNames.forEach(name => {
    if (available.length === 0) {
      available = [...originalColorsList]
    }
    const existingColor = current.get(name)

    if (existingColor) {
      assigned.set(name, existingColor)
      return
    }

    const nextColor = available.shift() as string
    assigned.set(name, nextColor)
  })
  return { assigned, available }
}

export const collectColors = (
  experimentNames: string[],
  current: Map<string, string>,
  unassigned = [...originalColorsList]
): Colors => {
  const available = unassignColors(experimentNames, current, unassigned)

  return assignColors(experimentNames, current, available)
}
