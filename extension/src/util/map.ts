export const addToMapArray = <K = string, V = unknown>(
  map: Map<K, V[]>,
  key: K,
  value: V
): void => {
  const existingArray = map.get(key)
  if (existingArray) {
    existingArray.push(value)
  } else {
    const newArray = [value]
    map.set(key, newArray)
  }
}

export const addToMapSet = <K = string, V = unknown>(
  map: Map<K, Set<V>>,
  key: K,
  value: V
): void => {
  const existingSet = map.get(key)
  if (existingSet) {
    existingSet.add(value)
  } else {
    const newSet = new Set([value])
    map.set(key, newSet)
  }
}

export const addToMapCount = (
  key: string,
  map: Map<string, number>
): number => {
  let count = map.get(key) || 0
  count++
  map.set(key, count)
  return count
}

export const flattenMapValues = <T>(map: Map<string, T[]>): T[] => {
  const iterator: IterableIterator<T[]> = map.values()
  return [...iterator].flat()
}
