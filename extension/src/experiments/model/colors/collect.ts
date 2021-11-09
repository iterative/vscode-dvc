import { colorsList as originalColorsList } from '.'

type Colors = {
  assignedColors: Map<string, string>
  unassignedColors: string[]
}

const unassignColors = (
  experimentNames: string[],
  currentColors: Map<string, string>,
  unassignedColors: string[]
) =>
  Object.entries(currentColors)
    .reverse()
    .forEach(([name, color]) => {
      if (!experimentNames.includes(name)) {
        unassignedColors.unshift(color)
      }
    })

const assignColors = (
  experimentNames: string[],
  currentColors: Map<string, string>,
  unassignedColors: string[]
): Colors => {
  const assignedColors = new Map()

  experimentNames.forEach(name => {
    if (unassignedColors.length === 0) {
      unassignedColors = [...originalColorsList]
    }
    const existingColor = currentColors.get(name)

    if (existingColor) {
      assignedColors.set(name, existingColor)
      return
    }

    const nextColor = unassignedColors.shift() as string
    assignedColors.set(name, nextColor)
  })
  return { assignedColors, unassignedColors }
}

export const collectColors = (
  experimentNames: string[],
  currentColors: Map<string, string>,
  unassignedColors = [...originalColorsList]
): Colors => {
  unassignColors(experimentNames, currentColors, unassignedColors)

  return assignColors(experimentNames, currentColors, unassignedColors)
}
