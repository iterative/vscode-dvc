export const colorsList = [
  '#945dd6',
  '#13adc7',
  '#f46837',
  '#48bb78',
  '#4299e1',
  '#ed8936',
  '#f56565'
] as const

export type Color = typeof colorsList[number]

export const copyOriginalColors = (): Color[] => [...colorsList]
