import { useColumnResize } from './useColumnResize'
import { Model } from '../model'
import { createCustomWindow } from '../../test/util'

jest.mock('../../shared/api')

describe('useColumnResize', () => {
  beforeAll(() => {
    createCustomWindow()
  })

  it('should return the columns width', () => {
    const expectedColumnsWidth = [
      { path: 'A', width: 1 },
      { path: 'B', width: 33 },
      { path: 'Z', width: 78 }
    ]
    const getColumnsWithWidthSpy = jest
      .spyOn(Model.prototype, 'getColumnsWithWidth')
      .mockImplementation(() => expectedColumnsWidth)
    const [columnsWidth] = useColumnResize()

    expect(getColumnsWithWidthSpy).toHaveBeenCalledTimes(1)
    expect(columnsWidth).toEqual(expectedColumnsWidth)
  })

  it('should return a method that calls setColumnWidth on the model', () => {
    const expectedId = 'my-id'
    const expectedWidth = 999
    const [, setColumnWidth] = useColumnResize()
    const setColumnWidthSpy = jest.spyOn(Model.prototype, 'setColumnWidth')

    setColumnWidth(expectedId, expectedWidth)

    expect(setColumnWidthSpy).toHaveBeenCalledTimes(1)
    expect(setColumnWidthSpy).toHaveBeenCalledWith(expectedId, expectedWidth)
  })
})
