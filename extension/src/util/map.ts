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

export const addToMapCount = (
  key: string,
  map: Map<string, number>
): number => {
  let count = map.get(key) || 0
  count++
  map.set(key, count)
  return count
}
