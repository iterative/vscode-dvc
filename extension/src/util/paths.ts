import { join, sep } from 'path'
export const joinColumnPath = join
export const splitColumnPath = (path: string) => path.split(sep)
