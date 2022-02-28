import { MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { useColumnOrder } from './useColumnOrder'

jest.mock('react', () => ({
  useMemo: (fn: (...args: unknown[]) => unknown) => fn()
}))
jest.mock('../../shared/api')

describe('useColumnOrder', () => {
  it('should return re-sorted columns with groups and generated parents', () => {
    const params: MetricOrParam[] = [
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
    const columnOrder: string[] = ['g2:C', 'g1:A', 'g1:B']
    const groupedParams = useColumnOrder(params, columnOrder)

    expect(groupedParams.map(col => col.path)).toStrictEqual([
      '0/g2:C',
      '1/g1:A',
      '1/g1:B',
      '0/g2',
      '1/g1'
    ])
  })
})
