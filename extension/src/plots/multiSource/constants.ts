export const StrokeDash = [
  [1, 0],
  [8, 8],
  [8, 4],
  [4, 4],
  [4, 2],
  [2, 1],
  [1, 1]
] as const
export type StrokeDashValue = typeof StrokeDash[number]

export const Shape = ['square', 'circle', 'triangle', 'diamond'] as const
export type ShapeValue = typeof Shape[number]

export type Scale<T extends StrokeDashValue | ShapeValue> = {
  domain: string[]
  range: T[]
}

export type Encoding<T extends StrokeDashValue | ShapeValue> = {
  scale: Scale<T>
} & { field: string }

export type StrokeDashScale = Scale<StrokeDashValue>
export type StrokeDashEncoding = Encoding<StrokeDashValue>

export type ShapeScale = Scale<ShapeValue>
export type ShapeEncoding = Encoding<ShapeValue>
