import { joinColumnPath, splitColumnPath } from './paths'
import { ColumnType } from '../webview/contract'

describe('joinColumnPath', () => {
  it('should properly join params with a nested param path', () => {
    expect(
      joinColumnPath(
        ColumnType.PARAMS,
        'params.yaml',
        'parent',
        'subparent',
        'child'
      )
    ).toStrictEqual('params:params.yaml:parent.subparent.child')
  })

  it('should properly join params with a non-nested param path', () => {
    expect(
      joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'parent')
    ).toStrictEqual('params:params.yaml:parent')
  })

  it('should properly join a path to a file with no params', () => {
    expect(joinColumnPath(ColumnType.PARAMS, 'params.yaml')).toStrictEqual(
      'params:params.yaml'
    )
  })

  it('should properly join a path to a file with no file or params', () => {
    expect(joinColumnPath(ColumnType.PARAMS)).toStrictEqual(ColumnType.PARAMS)
  })
})

describe('splitColumnPath', () => {
  it('should properly split params with a nested param path', () => {
    expect(
      splitColumnPath('params:params.yaml:parent.subparent.child')
    ).toStrictEqual([
      ColumnType.PARAMS,
      'params.yaml',
      'parent',
      'subparent',
      'child'
    ])
  })

  it('should properly split params with a path that has a posix nested file segment', () => {
    expect(splitColumnPath('params:nested/params.yaml:parent')).toStrictEqual([
      ColumnType.PARAMS,
      'nested/params.yaml',
      'parent'
    ])
  })

  it('should properly split params with a path that has a windows nested file segment', () => {
    expect(splitColumnPath('params:nested\\params.yaml:parent')).toStrictEqual([
      ColumnType.PARAMS,
      'nested\\params.yaml',
      'parent'
    ])
  })

  it('should properly split params with a non-nested param path', () => {
    expect(splitColumnPath('params:params.yaml:parent')).toStrictEqual([
      ColumnType.PARAMS,
      'params.yaml',
      'parent'
    ])
  })

  it('should properly split a path to a file with no param path', () => {
    expect(splitColumnPath('params:params.yaml')).toStrictEqual([
      ColumnType.PARAMS,
      'params.yaml'
    ])
  })

  it('should properly split a path to a file with no file or params', () => {
    expect(splitColumnPath(ColumnType.PARAMS)).toStrictEqual([
      ColumnType.PARAMS
    ])
  })

  it('should be able to split a path with the param segment containing a colon', () => {
    expect(
      splitColumnPath('params:params.yaml:parent.child:param')
    ).toStrictEqual([ColumnType.PARAMS, 'params.yaml', 'parent', 'child:param'])
  })
})
