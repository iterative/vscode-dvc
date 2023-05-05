import isEqual from 'lodash.isequal'

export type BaseType =
  | string
  | number
  | boolean
  | object
  | Obj
  | undefined
  | null

export type Any = BaseType | BaseType[]

type Obj = { [key: string]: Any }

export const keepReferenceIfEqual = (old: BaseType, recent: BaseType) =>
  isEqual(old, recent) ? old : recent
