import { Experiment } from '../components/Experiments'

const getItemKey: (input: Experiment) => string = input => input.id
const getParentKey: (input: any, parent: any) => string | undefined = (
  { checkpoint_parent },
  parent
) => (checkpoint_parent === parent.id ? undefined : checkpoint_parent)
const addChild: (parent: any, child: any) => void = (parent, child) => {
  parent.subRows = parent.subRows || []
  parent.subRows.push(child)
}
const setChildren: (parent: any, children: any[]) => void = (
  parent,
  children
) => {
  parent.subRows = children
}

export const nestSubRowsByParentKey: (
  base: Experiment
) => Experiment = base => {
  const { subRows } = base
  if (!subRows) return base

  const itemsByKey = new Map()
  const orphansByParentKey = new Map()
  const topLevelItems = []

  for (const item of subRows) {
    const resultingItem = item
    const itemKey = getItemKey(resultingItem)
    const parentKey = getParentKey(resultingItem, base)

    if (orphansByParentKey.has(itemKey)) {
      setChildren(resultingItem, orphansByParentKey.get(itemKey))
      orphansByParentKey.delete(itemKey)
    }

    // Add item to top level if it has no parent, otherwise add it to its parent.
    if (parentKey === undefined) {
      topLevelItems.push(item)
    } else if (itemsByKey.has(parentKey)) {
      addChild(itemsByKey.get(parentKey), resultingItem)
    } else if (orphansByParentKey.has(parentKey)) {
      orphansByParentKey.get(parentKey).push(resultingItem)
    } else {
      orphansByParentKey.set(parentKey, [resultingItem])
    }

    // Always add the item to the itemsByKey map
    itemsByKey.set(itemKey, resultingItem)
  }

  if (orphansByParentKey.size > 0) {
    throw new Error('Orphans left over after tree parsing!')
  }

  return {
    ...base,
    subRows: topLevelItems
  }
}

export const flattenNestedRows: (
  base: Experiment | Experiment[]
) => Experiment[] = base => {
  if (Array.isArray(base))
    return base.reduce<Experiment[]>(
      (acc, cur) => [...acc, ...flattenNestedRows(cur)],
      []
    )
  if (base.subRows) {
    const { subRows, ...rest } = base
    if (subRows.length === 1) {
      return [rest, ...flattenNestedRows(subRows)]
    }
    // More than one child
    return [
      {
        ...base,
        subRows: subRows.map(maybeFlattenChildren)
      }
    ]
  }
  return [base]
}

const maybeFlattenChildren: (item: Experiment) => Experiment = item => {
  if (item.subRows) {
    return {
      ...item,
      subRows: flattenNestedRows(item.subRows).reverse()
    }
  }
  return item
}

export const nestAndFlattenSubRows: (base: Experiment) => Experiment[] = base =>
  flattenNestedRows(nestSubRowsByParentKey(base))
