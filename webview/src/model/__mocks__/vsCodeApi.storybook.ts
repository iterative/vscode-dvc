import { addMessageHandler } from '../window'

export const getVsCodeApi = () => ({
  addMessageHandler,
  getState: () => {},
  postMessage: () => {},
  setState: () => {}
})
