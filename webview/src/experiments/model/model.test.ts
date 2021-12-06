import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { runInAction } from 'mobx'
import { Model } from '.'

jest.mock('../../shared/api')

describe('Model', () => {
  const columnOrder = ['A', 'D', 'C', 'B']
  const columnWidths = {
    A: 100,
    B: 170,
    C: 120,
    D: 130
  }

  let model: Model
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let modelAsAny: any

  beforeEach(() => {
    jest.resetAllMocks()
    model = new Model()
    modelAsAny = model
    runInAction(() => {
      modelAsAny.data = {
        columnOrder,
        columnWidths,
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
        ]
      }
    })
  })

  describe('setColumnWidth', () => {
    it('should send a message to notify of the change', () => {
      const expectedWidth = 4543
      const sendMessageSpy = jest.spyOn(Model.prototype, 'sendMessage')
      model.persistColumnWidth('D', expectedWidth)

      expect(sendMessageSpy).toHaveBeenCalledTimes(1)
      expect(sendMessageSpy).toHaveBeenCalledWith({
        payload: { id: 'D', width: expectedWidth },
        type: MessageFromWebviewType.COLUMN_RESIZED
      })
    })
  })

  describe('createColumnOrderRepresentation', () => {
    it('should send a message to notify of the changes if there is a new order set', () => {
      const sendMessageSpy = jest.spyOn(Model.prototype, 'sendMessage')
      sendMessageSpy.mockReset()

      model.persistColumnOrder(columnOrder)

      expect(sendMessageSpy).toHaveBeenCalledTimes(1)
      expect(sendMessageSpy).toHaveBeenCalledWith({
        payload: columnOrder,
        type: MessageFromWebviewType.COLUMN_REORDERED
      })
    })
  })
})
