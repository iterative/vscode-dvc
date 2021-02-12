export const getVsCodeApi = jest.fn().mockReturnValue({
  addMessageHandler: jest.fn(),
  getState: jest.fn(),
  postMessage: jest.fn(),
  setState: jest.fn()
})
