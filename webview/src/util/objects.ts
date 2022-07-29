import isEqual from 'lodash.isequal'
import { reorderObjectList } from 'dvc/src/util/array'

export const performOrderedUpdate = (
  order: string[],
  items: { [key: string]: unknown }[],
  key: string
): string[] => {
  const current = reorderObjectList(order, items, key)
  const added = items.filter(item => !order.includes(item[key] as string))

  return [...current, ...added].map(item => item?.[key]) as string[]
}

export const performSimpleOrderedUpdate = (
  order: string[],
  items: string[]
): string[] => {
  const newOrder = new Set([
    ...order.filter(orderedItem => items.includes(orderedItem)),
    ...items
  ])
  return [...newOrder]
}

export type BaseType = string | number | boolean | Object | undefined | null

export type Any = BaseType | BaseType[]

export const keepReferenceIfEqual = (old: BaseType, recent: BaseType) =>
  isEqual(old, recent) ? old : recent
