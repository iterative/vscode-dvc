export const Shape = ['square', 'circle', 'triangle'] as const
export const StrokeDash = [
  [1, 0],
  [8, 8],
  [8, 4],
  [4, 4],
  [4, 2],
  [2, 1],
  [1, 1]
] as const

export type StrokeDashScale = {
  domain: string[]
  range: typeof StrokeDash[number][]
}

export type StrokeDashEncoding = { scale: StrokeDashScale } & { field: string }

export type ShapeScale = {
  domain: string[]
  range: typeof Shape[number][]
}
export type ShapeEncoding = { scale: ShapeScale } & { field: string }
