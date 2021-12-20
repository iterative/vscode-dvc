import { joinMetricOrParamPath, splitMetricOrParamPath } from './paths'

describe('joinMetricOrParamPath', () => {
  it('should properly join params with a nested param path', () => {
    expect(
      joinMetricOrParamPath(
        'params',
        'params.yaml',
        'parent',
        'subparent',
        'child'
      )
    ).toEqual('params:params.yaml:parent.subparent.child')
  })

  it('should properly join params with a non-nested param path', () => {
    expect(joinMetricOrParamPath('params', 'params.yaml', 'parent')).toEqual(
      'params:params.yaml:parent'
    )
  })

  it('should properly join a path to a file with no params', () => {
    expect(joinMetricOrParamPath('params', 'params.yaml')).toEqual(
      'params:params.yaml'
    )
  })

  it('should properly join a path to a file with no file or params', () => {
    expect(joinMetricOrParamPath('params')).toEqual('params')
  })
})

describe('splitMetricOrParamPath', () => {
  it('should properly split params with a nested param path', () => {
    expect(
      splitMetricOrParamPath('params:params.yaml:parent.subparent.child')
    ).toEqual(['params', 'params.yaml', 'parent', 'subparent', 'child'])
  })

  it('should properly split params with a path that has a posix nested file segment', () => {
    expect(splitMetricOrParamPath('params:nested/params.yaml:parent')).toEqual([
      'params',
      'nested/params.yaml',
      'parent'
    ])
  })

  it('should properly split params with a path that has a windows nested file segment', () => {
    expect(splitMetricOrParamPath('params:nested\\params.yaml:parent')).toEqual(
      ['params', 'nested\\params.yaml', 'parent']
    )
  })

  it('should properly split params with a non-nested param path', () => {
    expect(splitMetricOrParamPath('params:params.yaml:parent')).toEqual([
      'params',
      'params.yaml',
      'parent'
    ])
  })

  it('should properly split a path to a file with no param path', () => {
    expect(splitMetricOrParamPath('params:params.yaml')).toEqual([
      'params',
      'params.yaml'
    ])
  })

  it('should properly split a path to a file with no file or params', () => {
    expect(splitMetricOrParamPath('params')).toEqual(['params'])
  })

  it('should be able to split a path with the param segment containing a colon', () => {
    expect(
      splitMetricOrParamPath('params:params.yaml:parent.child:param')
    ).toEqual(['params', 'params.yaml', 'parent', 'child:param'])
  })
})
