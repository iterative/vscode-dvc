export const hasKey = (obj: Object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key)
