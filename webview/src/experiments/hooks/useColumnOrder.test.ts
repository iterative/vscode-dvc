import { useColumnOrder } from './useColumnsOrder'
import { Model } from '../model'
import { createCustomWindow } from '../../test/util'

jest.mock('../../shared/api')

describe('useColumnsOrder', () => {
  beforeAll(() => {
    createCustomWindow()
  })

  it('should return the columnOrderRepresentation', () => {
    const model = Model.getInstance()
    const expectedColumnsRepresentation = [
      {
        group: 'group1',
        hasChildren: false,
        name: 'A',
        parentPath: 'g1',
        path: 'g1:A'
      },
      {
        group: 'group1',
        hasChildren: false,
        name: 'B',
        parentPath: 'g1',
        path: 'g1:B'
      },
      {
        group: 'group2',
        hasChildren: false,
        name: 'C',
        parentPath: 'g2',
        path: 'g2:C'
      }
    ]
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(Model.prototype as any, 'getOrderedDataWithGroups')
      .mockImplementation(() => expectedColumnsRepresentation)
    model.createColumnsOrderRepresentation([])
    const [columnOrderRepresentation] = useColumnOrder(model)

    expect(columnOrderRepresentation).toEqual(expectedColumnsRepresentation)
  })

  it('should return a method that calls createColumnsOrderRepresentation on the model', () => {
    const model = Model.getInstance()
    const expectedOrder = ['A', 'C', 'B', 'Z']
    const [, setColumnOrderRepresentation] = useColumnOrder(model)
    const createColumnsOrderRepresentationSpy = jest.spyOn(
      Model.prototype,
      'createColumnsOrderRepresentation'
    )

    setColumnOrderRepresentation(expectedOrder)

    expect(createColumnsOrderRepresentationSpy).toHaveBeenCalledTimes(1)
    expect(createColumnsOrderRepresentationSpy).toHaveBeenCalledWith(
      expectedOrder
    )
  })
})
