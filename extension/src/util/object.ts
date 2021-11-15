export const hasKey = (maybeObject: unknown, key: string): boolean =>
  typeof maybeObject === 'object' &&
  Object.prototype.hasOwnProperty.call(maybeObject, key)
