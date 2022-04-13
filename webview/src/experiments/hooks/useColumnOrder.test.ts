import {
  MetricOrParam,
  MetricOrParamGroup
} from 'dvc/src/experiments/webview/contract'
import { useColumnOrder } from './useColumnOrder'

jest.mock('react', () => ({
  useMemo: (fn: (...args: unknown[]) => unknown) => fn()
}))
jest.mock('../../shared/api')

describe('useColumnOrder', () => {
  it('should return re-sorted columns with groups and generated parents', () => {
    const metricsAndParams: MetricOrParam[] = [
      {
        group: MetricOrParamGroup.METRICS,
        hasChildren: false,
        name: 'A',
        parentPath: MetricOrParamGroup.METRICS,
        path: `${MetricOrParamGroup.METRICS}:A`
      },
      {
        group: MetricOrParamGroup.METRICS,
        hasChildren: false,
        name: 'B',
        parentPath: MetricOrParamGroup.METRICS,
        path: `${MetricOrParamGroup.METRICS}:B`
      },
      {
        group: MetricOrParamGroup.PARAMS,
        hasChildren: false,
        name: 'C',
        parentPath: MetricOrParamGroup.PARAMS,
        path: `${MetricOrParamGroup.PARAMS}:C`
      }
    ]
    const columnOrder: string[] = [
      `${MetricOrParamGroup.PARAMS}:C`,
      `${MetricOrParamGroup.METRICS}:A`,
      `${MetricOrParamGroup.METRICS}:B`
    ]
    const groupedParams = useColumnOrder(metricsAndParams, columnOrder)

    expect(groupedParams.map(col => col.path)).toStrictEqual([
      `0/${MetricOrParamGroup.PARAMS}:C`,
      `1/${MetricOrParamGroup.METRICS}:A`,
      `1/${MetricOrParamGroup.METRICS}:B`,
      `0/${MetricOrParamGroup.PARAMS}`,
      `1/${MetricOrParamGroup.METRICS}`
    ])
  })
})
