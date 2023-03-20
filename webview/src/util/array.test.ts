import { changeOrderWithDraggedInfo, pushIf } from './array'

describe('array', () => {
  describe('pushIf', () => {
    it('should not push to array if condiction is not met', () => {
      const currentArray = [1, 2, 3]
      pushIf(currentArray, false, [4])

      expect(currentArray.length).toBe(3)
    })

    it('should push to array if condiction is met', () => {
      const currentArray = [1, 2, 3]
      pushIf(currentArray, true, [4])

      expect(currentArray.length).toBe(4)
    })
  })

  describe('changeOrderWithDraggedInfo', () => {
    it('should return the same order if there are no draggedInfo', () => {
      const currentOrder = ['1', '2', '3', '4']

      expect(changeOrderWithDraggedInfo(currentOrder, undefined)).toBe(
        currentOrder
      )
    })

    it('should return the order with the dragged item id moved to the end', () => {
      const currentOrder = ['1', '2', '3', '4']

      expect(
        changeOrderWithDraggedInfo(currentOrder, {
          group: 'any',
          itemId: '2',
          itemIndex: '1'
        })
      ).toStrictEqual(['1', '3', '4', '2'])
    })
  })
})
