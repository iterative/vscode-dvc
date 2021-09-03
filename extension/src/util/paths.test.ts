import { joinParamOrMetricPath, splitParamOrMetricPath } from './paths'

describe('joinParamOrMetricPath', () => {
  it('should properly join params with a nested param path', () => {
    expect(
      joinParamOrMetricPath(
        'params',
        'params.yaml',
        'parent',
        'subparent',
        'child'
      )
    ).toEqual('params:params.yaml:parent.subparent.child')
  })

  it('should properly join params with a non-nested param path', () => {
    expect(joinParamOrMetricPath('params', 'params.yaml', 'parent')).toEqual(
      'params:params.yaml:parent'
    )
  })

  it('should properly join a path to a file with no params', () => {
    expect(joinParamOrMetricPath('params', 'params.yaml')).toEqual(
      'params:params.yaml'
    )
  })

  it('should properly join a path to a file with no file or params', () => {
    expect(joinParamOrMetricPath('params')).toEqual('params')
  })
})

describe('splitParamOrMetricPath', () => {
  it('should properly split params with a nested param path', () => {
    expect(
      splitParamOrMetricPath('params:params.yaml:parent.subparent.child')
    ).toEqual(['params', 'params.yaml', 'parent', 'subparent', 'child'])
  })

  it('should properly split params with a path that has a posix nested file segment', () => {
    expect(splitParamOrMetricPath('params:nested/params.yaml:parent')).toEqual([
      'params',
      'nested/params.yaml',
      'parent'
    ])
  })

  it('should properly split params with a path that has a windows nested file segment', () => {
    expect(splitParamOrMetricPath('params:nested\\params.yaml:parent')).toEqual(
      ['params', 'nested\\params.yaml', 'parent']
    )
  })

  it('should properly split params with a non-nested param path', () => {
    expect(splitParamOrMetricPath('params:params.yaml:parent')).toEqual([
      'params',
      'params.yaml',
      'parent'
    ])
  })

  it('should properly split a path to a file with no param path', () => {
    expect(splitParamOrMetricPath('params:params.yaml')).toEqual([
      'params',
      'params.yaml'
    ])
  })

  it('should properly split a path to a file with no file or params', () => {
    expect(splitParamOrMetricPath('params')).toEqual(['params'])
  })

  it('should be able to split a path with the param segment containing a colon', () => {
    expect(
      splitParamOrMetricPath('params:params.yaml:parent.child:param')
    ).toEqual(['params', 'params.yaml', 'parent', 'child:param'])
  })
})
