const StyleUtils = require('./src/util/styles')

// eslint-disable-next-line no-global-assign
window = {
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}

const mutationObserverMock = jest.fn().mockImplementation(() => {
  return {
    disconnect: jest.fn(),
    observe: jest.fn(),
    takeRecords: jest.fn()
  }
})
global.MutationObserver = mutationObserverMock

const intersectionObserverMock = jest.fn().mockImplementation(() => {
  return {
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }
})
global.IntersectionObserver = intersectionObserverMock

StyleUtils.getThemeValue = jest.fn().mockImplementation(() => '#ffffff')
