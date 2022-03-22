export type Items = { [key: string]: unknown }[]

export const reorderObjectList = (
  order: string[],
  items: Items,
  compareKey: string
): Items => {
  const copy = [...items]
  return order
    .map(orderedItem => copy?.find(item => item[compareKey] === orderedItem))
    .filter(Boolean) as Items
}

export const performOrderedUpdate = (
  order: string[],
  items: Items,
  key: string
): string[] => {
  const copy = [...items]
  const current = reorderObjectList(order, copy, key)
  const added = copy?.filter(item => !order.includes(item[key] as string))

  return [...current, ...added].map(item => item?.[key]) as string[]
}
