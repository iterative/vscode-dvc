type Items = { [key: string]: unknown }[]

export const stringToObjectList = (
  stringList: string[],
  items: Items,
  compareKey: string
) => {
  return stringList
    .map(orderedItem => items.find(item => item[compareKey] === orderedItem))
    .filter(Boolean)
}

export const performOrderedUpdate = (
  order: string[],
  items: Items,
  key: string
): string[] => {
  const current = stringToObjectList(order, items, key)
  const added = items.filter(item => !order.includes(item[key] as string))

  return [...current, ...added].map(item => item?.[key]) as string[]
}
