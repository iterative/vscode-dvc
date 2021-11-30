import { ColumnDetail } from 'dvc/src/experiments/webview/contract'
import { useColumnOrder } from './useColumnsOrder'
import { Model } from '../model'

jest.mock('react', () => ({
  useMemo: (fn: (...args: unknown[]) => unknown) => fn()
}))
jest.mock('../../shared/api')

describe('useColumnsOrder', () => {
  it('should return re-sorted columns with groups and generated parents', () => {
    const columns = [
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
    const columnsOrderByPath: string[] = ['g2:C', 'g1:A', 'g1:B']
    const columnsOrder: ColumnDetail[] = columnsOrderByPath.map(path => ({
      path,
      width: 100
    }))
    const model = {
      data: {
        columns,
        columnsOrder
      }
    } as Model
    const [columnOrderRepresentation] = useColumnOrder(model)

    expect(columnOrderRepresentation.map(col => col.path)).toEqual([
      '0/g2:C',
      '1/g1:A',
      '1/g1:B',
      '0/g2',
      '1/g1'
    ])
  })

  it('should return a method that calls sendColumnsOrder on the model', () => {
    const model = new Model()
    const expectedOrder = ['A', 'C', 'B', 'Z']
    const [, setColumnOrderRepresentation] = useColumnOrder(model)
    const sendColumnsOrderSpy = jest.spyOn(Model.prototype, 'sendColumnsOrder')

    setColumnOrderRepresentation(expectedOrder)

    expect(sendColumnsOrderSpy).toHaveBeenCalledTimes(1)
    expect(sendColumnsOrderSpy).toHaveBeenCalledWith(expectedOrder)
  })
})
