import { colorsList as originalColorsList } from '.'

const unassignColors = (
  experimentNames: string[],
  currentColors: Record<string, string>,
  unassignedColors: string[]
) =>
  Object.entries(currentColors).forEach(([name, color]) => {
    if (!experimentNames.includes(name)) {
      unassignedColors.unshift(color)
    }
  })

const assignColors = (
  experimentNames: string[],
  currentColors: Record<string, string>,
  unassignedColors: string[]
): Record<string, string> => {
  const assignedColors = {} as Record<string, string>

  experimentNames.forEach(name => {
    if (unassignedColors.length === 0) {
      unassignedColors = originalColorsList
    }
    const existingColor = currentColors[name]

    if (existingColor) {
      assignedColors[name] = existingColor
      return
    }

    assignedColors[name] = unassignedColors.shift() as string
  })
  return assignedColors
}

export const collectColors = (
  experimentNames: string[],
  currentColors: Record<string, string>,
  unassignedColors = originalColorsList
): { assignedColors: Record<string, string>; unassignedColors: string[] } => {
  unassignColors(experimentNames, currentColors, unassignedColors)

  const assignedColors = assignColors(
    experimentNames,
    currentColors,
    unassignedColors
  )

  return { assignedColors, unassignedColors }
}
