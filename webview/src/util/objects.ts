import isEqual from 'lodash.isequal'

export type BaseType = string | number | boolean | Object | undefined | null

export type Any = BaseType | BaseType[]

export const keepReferenceIfEqual = (old: BaseType, recent: BaseType) =>
  isEqual(old, recent) ? old : recent
