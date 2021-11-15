import { WebviewColorTheme } from 'dvc/src/webview/contract'
import { useColumnOrder } from './useColumnsOrder'
import { Model } from '../model'

jest.mock('../../shared/api')

describe('useColumnsOrder', () => {
  beforeAll(() => {
    const customWindow = {
      addEventListener: jest.fn,
      webviewData: {
        theme: WebviewColorTheme.dark
      }
    }
    Object.defineProperty(global, 'window', { value: customWindow })
  })

  it('should return the columnOrderRepresentation', () => {
    const expectedColumnsRepresentation = [
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
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(Model.prototype as any, 'getOrderedDataWithGroups')
      .mockImplementation(() => expectedColumnsRepresentation)
    Model.getInstance().createColumnsOrderRepresentation([])
    const [columnOrderRepresentation] = useColumnOrder()

    expect(columnOrderRepresentation).toEqual(expectedColumnsRepresentation)
  })

  it('should return a method that calls createColumnsOrderRepresentation on the model', () => {
    const expectedOrder = ['A', 'C', 'B', 'Z']
    const [, setColumnOrderRepresentation] = useColumnOrder()
    const createColumnsOrderRepresentationSpy = jest.spyOn(
      Model.prototype,
      'createColumnsOrderRepresentation'
    )

    setColumnOrderRepresentation(expectedOrder)

    expect(createColumnsOrderRepresentationSpy).toHaveBeenCalledTimes(1)
    expect(createColumnsOrderRepresentationSpy).toHaveBeenCalledWith(
      expectedOrder
    )
  })
})
