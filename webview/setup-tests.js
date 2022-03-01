const StyleUtils = require('./src/util/styles')

/* eslint-disable */
window = {
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}

const mutationObserverMock = jest.fn().mockImplementation(() => {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn()
  }
})
global.MutationObserver = mutationObserverMock

StyleUtils.getThemeValue = jest.fn().mockImplementation(() => '#ffffff')
