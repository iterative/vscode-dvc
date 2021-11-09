import omit from 'lodash.omit'
import { colorsList as originalColorsList } from '.'
import { ExperimentsOutput } from '../../../cli/reader'

const collectExperimentNames = (data: ExperimentsOutput): string[] => {
  const experimentNames: string[] = []

  for (const experimentsObject of Object.values(omit(data, 'workspace'))) {
    Object.entries(experimentsObject).forEach(([sha, fieldsOrError]) => {
      if (
        fieldsOrError.data?.checkpoint_tip === sha &&
        fieldsOrError.data?.name
      ) {
        experimentNames.push(fieldsOrError.data?.name)
      }
    })
  }
  return experimentNames
}

const unassignColors = (
  experimentNames: string[],
  currentColors: Record<string, string>,
  unusedColors: string[]
) =>
  Object.entries(currentColors).forEach(([name, color]) => {
    if (!experimentNames.includes(name)) {
      unusedColors.unshift(color)
    }
  })

const assignColors = (
  experimentNames: string[],
  unusedColors: string[]
): Record<string, string> => {
  const assignedColors = {} as Record<string, string>

  experimentNames.forEach(name => {
    if (unusedColors.length === 0) {
      unusedColors = originalColorsList
    }
    assignedColors[name] = unusedColors.shift() as string
  })
  return assignedColors
}

export const collectColors = (
  data: ExperimentsOutput,
  currentColors: Record<string, string>,
  unusedColors = originalColorsList
): { assignedColors: Record<string, string>; unusedColors: string[] } => {
  const experimentNames = collectExperimentNames(data)

  unassignColors(experimentNames, currentColors, unusedColors)

  const assignedColors = assignColors(experimentNames, unusedColors)

  return { assignedColors, unusedColors }
}
