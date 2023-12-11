import isEqual from 'lodash.isequal'

export type BaseType =
  | string
  | number
  | boolean
  | object
  | Obj
  | undefined
  | null

type Any = BaseType | BaseType[]

type Obj = { [key: string]: Any }

export const keepReferenceIfEqual = <T extends BaseType>(
  old: T,
  recent: T
): T => (isEqual(old, recent) ? old : recent)
