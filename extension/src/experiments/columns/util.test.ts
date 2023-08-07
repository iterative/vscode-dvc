import { getValue } from './util'
import rowsFixture from '../../test/fixtures/expShow/base/rows'
import columnsFixture from '../../test/fixtures/expShow/base/columns'
import { ColumnType } from '../webview/contract'

describe('getValue', () => {
  const experiment = rowsFixture[0]

  const getPathArrayFromType = (columnType: ColumnType) => {
    const column = columnsFixture.find(
      ({ type, hasChildren }) => type === columnType && !hasChildren
    )

    if (!column) {
      throw new Error('column not defined')
    }
    const { pathArray } = column
    expect(pathArray).toBeDefined()
    if (!pathArray) {
      throw new Error('pathArray not defined')
    }
    return pathArray
  }

  it('should return the expected value for an experiment given a metric', () => {
    const pathArray = getPathArrayFromType(ColumnType.METRICS)
    expect(getValue(experiment, pathArray)).toStrictEqual(1.775016188621521)
  })

  it('should return the expected value for an experiment given a param', () => {
    const pathArray = getPathArrayFromType(ColumnType.PARAMS)
    expect(getValue(experiment, pathArray)).toStrictEqual([0, 1])
  })

  it('should return the expected value for an experiment given a dep', () => {
    const pathArray = getPathArrayFromType(ColumnType.DEPS)
    expect(getValue(experiment, pathArray)).toStrictEqual('22a1a29')
  })

  it('should not mutate the original array', () => {
    const pathArray = getPathArrayFromType(ColumnType.DEPS)
    const copy = [...pathArray]
    getValue(experiment, pathArray)
    expect(pathArray).toStrictEqual(copy)
  })
})
