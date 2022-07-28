import isEqual from 'lodash.isequal'
import { BaseType } from './objects'

export const pushIf = <T>(array: T[], condition: boolean, elements: T[]) =>
  condition && array.push(...elements)

export const keepEqualOldReferencesInArray = (
  oldArray: BaseType[],
  newArray: BaseType[]
) =>
  newArray.map(item => oldArray.find(oldItem => isEqual(oldItem, item)) || item)
