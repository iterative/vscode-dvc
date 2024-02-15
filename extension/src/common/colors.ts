const colorsList = [
  '#945dd6',
  '#13adc7',
  '#f46837',
  '#48bb78',
  '#4299e1',
  '#ed8936',
  '#f56565'
] as const

export type Color = (typeof colorsList)[number]

export const copyOriginalColors = (): Color[] => [...colorsList]

const boundingBoxColorsList = [
  '#ff3838',
  '#ff9d97',
  '#ff701f',
  '#ffb21d',
  '#cfd231',
  '#48f90a',
  '#92cc17',
  '#3ddb86',
  '#1a9334',
  '#00d4bb',
  '#2c99a8',
  '#00c2ff',
  '#344593',
  '#6473ff',
  '#0018ec',
  '#8438ff',
  '#520085',
  '#cb38ff',
  '#ff95c8',
  '#ff37c7'
] as const

export type BoundingBoxColor = (typeof boundingBoxColorsList)[number]

export const getBoundingBoxColor = (ind: number): BoundingBoxColor =>
  boundingBoxColorsList[ind % boundingBoxColorsList.length]
