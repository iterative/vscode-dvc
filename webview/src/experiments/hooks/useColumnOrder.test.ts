import { Column, ColumnType } from 'dvc/src/experiments/webview/contract'
import { useColumnOrder } from './useColumnOrder'

jest.mock('react', () => ({
  useMemo: (fn: (...args: unknown[]) => unknown) => fn()
}))
jest.mock('../../shared/api')

describe('useColumnOrder', () => {
  it('should return re-sorted columns with groups and generated parents', () => {
    const columns: Column[] = [
      {
        hasChildren: false,
        label: 'A',
        parentPath: ColumnType.METRICS,
        path: `${ColumnType.METRICS}:A`,
        type: ColumnType.METRICS
      },
      {
        hasChildren: false,
        label: 'B',
        parentPath: ColumnType.METRICS,
        path: `${ColumnType.METRICS}:B`,
        type: ColumnType.METRICS
      },
      {
        hasChildren: false,
        label: 'C',
        parentPath: ColumnType.PARAMS,
        path: `${ColumnType.PARAMS}:C`,
        type: ColumnType.PARAMS
      }
    ]
    const columnOrder: string[] = [
      `${ColumnType.PARAMS}:C`,
      `${ColumnType.METRICS}:A`,
      `${ColumnType.METRICS}:B`
    ]
    const groupedParams = useColumnOrder(columns, columnOrder)

    expect(groupedParams.map(col => col.path)).toStrictEqual([
      `0/${ColumnType.PARAMS}:C`,
      `1/${ColumnType.METRICS}:A`,
      `1/${ColumnType.METRICS}:B`,
      `0/${ColumnType.PARAMS}`,
      `1/${ColumnType.METRICS}`
    ])
  })
})
