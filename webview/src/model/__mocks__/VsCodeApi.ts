import { addMessageHandler } from '../window'

export const getVsCodeApi = jest.fn().mockReturnValue({
  addMessageHandler,
  getState: jest.fn(),
  postMessage: jest.fn(),
  setState: jest.fn()
})
