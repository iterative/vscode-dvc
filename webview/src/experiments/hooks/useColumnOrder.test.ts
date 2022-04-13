import {
  MetricOrParam,
  MetricOrParamType
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
        hasChildren: false,
        name: 'A',
        parentPath: MetricOrParamType.METRICS,
        path: `${MetricOrParamType.METRICS}:A`,
        type: MetricOrParamType.METRICS
      },
      {
        hasChildren: false,
        name: 'B',
        parentPath: MetricOrParamType.METRICS,
        path: `${MetricOrParamType.METRICS}:B`,
        type: MetricOrParamType.METRICS
      },
      {
        hasChildren: false,
        name: 'C',
        parentPath: MetricOrParamType.PARAMS,
        path: `${MetricOrParamType.PARAMS}:C`,
        type: MetricOrParamType.PARAMS
      }
    ]
    const columnOrder: string[] = [
      `${MetricOrParamType.PARAMS}:C`,
      `${MetricOrParamType.METRICS}:A`,
      `${MetricOrParamType.METRICS}:B`
    ]
    const groupedParams = useColumnOrder(metricsAndParams, columnOrder)

    expect(groupedParams.map(col => col.path)).toStrictEqual([
      `0/${MetricOrParamType.PARAMS}:C`,
      `1/${MetricOrParamType.METRICS}:A`,
      `1/${MetricOrParamType.METRICS}:B`,
      `0/${MetricOrParamType.PARAMS}`,
      `1/${MetricOrParamType.METRICS}`
    ])
  })
})
