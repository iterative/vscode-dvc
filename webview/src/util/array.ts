import isEqual from 'lodash.isequal'
import { BaseType } from './objects'
import { DraggedInfo } from '../shared/components/dragDrop/dragDropSlice'

export const pushIf = <T>(array: T[], condition: boolean, elements: T[]) =>
  condition && array.push(...elements)

export const keepEqualOldReferencesInArray = (
  oldArray: BaseType[],
  newArray: BaseType[]
) =>
  newArray.map(item => oldArray.find(oldItem => isEqual(oldItem, item)) || item)

export const changeOrderWithDraggedInfo = (
  order: string[],
  dragged: DraggedInfo
) => {
  if (!dragged) {
    return order
  }
  const newOrder = [...order]
  const draggedIndex = Number.parseInt(dragged.itemIndex, 10)

  newOrder.splice(draggedIndex, 1)
  newOrder.push(dragged.itemId)
  return newOrder
}
