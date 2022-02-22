export const performOrderedUpdate = (
  order: string[],
  items: { [key: string]: unknown }[],
  key: string
): string[] => {
  const current = order
    .map(orderedItem => items.find(item => item[key] === orderedItem))
    .filter(Boolean)
  const added = items.filter(item => !order.includes(item[key] as string))

  return [...current, ...added].map(item => item?.[key]) as string[]
}
