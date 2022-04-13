import { joinMetricOrParamPath, splitMetricOrParamPath } from './paths'
import { MetricOrParamType } from '../webview/contract'

describe('joinMetricOrParamPath', () => {
  it('should properly join params with a nested param path', () => {
    expect(
      joinMetricOrParamPath(
        MetricOrParamType.PARAMS,
        'params.yaml',
        'parent',
        'subparent',
        'child'
      )
    ).toStrictEqual('params:params.yaml:parent.subparent.child')
  })

  it('should properly join params with a non-nested param path', () => {
    expect(
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml', 'parent')
    ).toStrictEqual('params:params.yaml:parent')
  })

  it('should properly join a path to a file with no params', () => {
    expect(
      joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
    ).toStrictEqual('params:params.yaml')
  })

  it('should properly join a path to a file with no file or params', () => {
    expect(joinMetricOrParamPath(MetricOrParamType.PARAMS)).toStrictEqual(
      MetricOrParamType.PARAMS
    )
  })
})

describe('splitMetricOrParamPath', () => {
  it('should properly split params with a nested param path', () => {
    expect(
      splitMetricOrParamPath('params:params.yaml:parent.subparent.child')
    ).toStrictEqual([
      MetricOrParamType.PARAMS,
      'params.yaml',
      'parent',
      'subparent',
      'child'
    ])
  })

  it('should properly split params with a path that has a posix nested file segment', () => {
    expect(
      splitMetricOrParamPath('params:nested/params.yaml:parent')
    ).toStrictEqual([MetricOrParamType.PARAMS, 'nested/params.yaml', 'parent'])
  })

  it('should properly split params with a path that has a windows nested file segment', () => {
    expect(
      splitMetricOrParamPath('params:nested\\params.yaml:parent')
    ).toStrictEqual([MetricOrParamType.PARAMS, 'nested\\params.yaml', 'parent'])
  })

  it('should properly split params with a non-nested param path', () => {
    expect(splitMetricOrParamPath('params:params.yaml:parent')).toStrictEqual([
      MetricOrParamType.PARAMS,
      'params.yaml',
      'parent'
    ])
  })

  it('should properly split a path to a file with no param path', () => {
    expect(splitMetricOrParamPath('params:params.yaml')).toStrictEqual([
      MetricOrParamType.PARAMS,
      'params.yaml'
    ])
  })

  it('should properly split a path to a file with no file or params', () => {
    expect(splitMetricOrParamPath(MetricOrParamType.PARAMS)).toStrictEqual([
      MetricOrParamType.PARAMS
    ])
  })

  it('should be able to split a path with the param segment containing a colon', () => {
    expect(
      splitMetricOrParamPath('params:params.yaml:parent.child:param')
    ).toStrictEqual([
      MetricOrParamType.PARAMS,
      'params.yaml',
      'parent',
      'child:param'
    ])
  })
})
