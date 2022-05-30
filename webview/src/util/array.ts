export function pushIf<T>(array: T[], condition: boolean, elements: T[]) {
  condition && array.push(...elements)
}
