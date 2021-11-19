import {
  MessageFromWebviewType,
  WebviewColorTheme
} from 'dvc/src/webview/contract'
import { runInAction } from 'mobx'
import { Model } from '.'
import { createCustomWindow } from '../../test/util'

jest.mock('../../shared/api')

describe('Model', () => {
  const columnsOrder = [
    { path: 'A', width: 100 },
    { path: 'D', width: 130 },
    { path: 'C', width: 120 },
    { path: 'B', width: 170 }
  ]

  let model: Model
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let modelAsAny: any

  beforeAll(() => {
    createCustomWindow()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    model = new Model()
    modelAsAny = model
    runInAction(() => {
      modelAsAny.data = {
        columns: [
          {
            parentPath: 'a',
            path: 'a:a'
          },
          {
            parentPath: 'a',
            path: 'a:b'
          },
          {
            parentPath: 'a',
            path: 'a:c'
          },
          {
            parentPath: 'b',
            path: 'b:a'
          }
        ],
        columnsOrder
      }
    })
  })

  describe('getColumnsWithWidth', () => {
    it('should return the columns order', () => {
      expect(model.getColumnsWithWidth()).toEqual(columnsOrder)
    })

    it('should return an empty array if there is no data', () => {
      runInAction(() => {
        model.data = undefined
      })

      expect(model.getColumnsWithWidth()).toEqual([])
    })

    it('should return an empty array if there is no columnsOrder on the data', () => {
      runInAction(() => {
        modelAsAny.data = { theme: WebviewColorTheme.DARK }
      })
      expect(model.getColumnsWithWidth()).toEqual([])
    })
  })

  describe('setColumnWidth', () => {
    it('should change the width of the column in the columnsorder', () => {
      const expectedWidth = 222
      model.setColumnWidth('D', expectedWidth)

      expect(modelAsAny.data.columnsOrder[1].width).toBe(expectedWidth)
    })

    it('should send a message to notify of the change', () => {
      const expectedWidth = 4543
      const sendMessageSpy = jest.spyOn(Model.prototype, 'sendMessage')
      model.setColumnWidth('D', expectedWidth)

      expect(sendMessageSpy).toHaveBeenCalledTimes(1)
      expect(sendMessageSpy).toHaveBeenCalledWith({
        payload: { id: 'D', width: expectedWidth },
        type: MessageFromWebviewType.COLUMN_RESIZED
      })
    })
  })

  describe('createColumnsOrderRepresentation', () => {
    it('should send a message to notify of the changes if there is a new order set', () => {
      const sendMessageSpy = jest.spyOn(Model.prototype, 'sendMessage')
      sendMessageSpy.mockReset()

      const expectedOrder = columnsOrder.map(column => column.path)

      model.sendColumnsOrder(expectedOrder)

      expect(sendMessageSpy).toHaveBeenCalledTimes(1)
      expect(sendMessageSpy).toHaveBeenCalledWith({
        payload: expectedOrder,
        type: MessageFromWebviewType.COLUMN_REORDERED
      })
    })
  })
})
