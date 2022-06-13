export const performSimpleOrderedUpdate = (
  order: string[],
  items: string[]
): string[] => {
  const newOrder = new Set([...order, ...items])
  return [...newOrder]
}

type BaseType = string | number | boolean | Object | undefined | null

export type Any = BaseType | BaseType[]
