const SEPARATOR = '/'
export const joinColumnPath = (...pathArray: string[]) =>
  pathArray.join(SEPARATOR)
export const splitColumnPath = (path: string) => path.split(SEPARATOR)
